import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, type Pedido } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CuponsService } from '../cupons/cupons.service';
import { FreteService } from '../frete/frete.service';
import { InfinitePayService } from '../pagamentos/infinitepay.service';
import { EmailsService } from '../emails/emails.service';
import { CriarPedidoDto } from './pedidos.dto';
import { asRecord, safeString } from '../common/utils/value';

type TamanhoEstoque = { label: string; estoque: number };

type ItemPedidoPersistido = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  tamanhoEscolhido: string;
  imgUrl: string;
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
};

@Injectable()
export class PedidosService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PedidosService.name);
  private verificadorExpiracao?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cuponsService: CuponsService,
    private readonly freteService: FreteService,
    private readonly infinitePayService: InfinitePayService,
    private readonly emailsService: EmailsService,
  ) {}

  onModuleInit() {
    this.verificadorExpiracao = setInterval(() => {
      void this.cancelarPedidosExpirados().catch(() => undefined);
    }, 60_000);
    this.verificadorExpiracao.unref?.();
    void this.cancelarPedidosExpirados().catch(() => undefined);
  }

  onModuleDestroy() {
    if (this.verificadorExpiracao) clearInterval(this.verificadorExpiracao);
  }

  private minutosParaPagamento() {
    const minutos = Number(process.env.PAGAMENTO_EXPIRACAO_MINUTOS || 30);
    return Number.isFinite(minutos) && minutos >= 10 && minutos <= 1440
      ? Math.floor(minutos)
      : 30;
  }

  private normalizarTamanho(label: unknown) {
    const texto = safeString(label).trim();
    return texto.toLowerCase().includes('nico') ? 'U' : texto.toUpperCase();
  }

  private lerTamanhos(valor: unknown): TamanhoEstoque[] {
    if (!Array.isArray(valor)) return [];
    return valor
      .map((item) => {
        const tamanho = asRecord(item);
        return {
          label: this.normalizarTamanho(tamanho.label),
          estoque: Math.max(0, Math.floor(Number(tamanho.estoque) || 0)),
        };
      })
      .filter((item) => Boolean(item.label));
  }

  async criar(dados: CriarPedidoDto, usuarioId: string, origemPublica: string) {
    if (!usuarioId)
      throw new BadRequestException('E necessario estar logado para comprar.');
    const [usuario, configuracao] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: usuarioId },
        select: { emailVerifiedAt: true, email: true },
      }),
      this.prisma.configuracao.findFirst({
        select: { lojaAberta: true },
      }),
    ]);
    if (!usuario) throw new ForbiddenException('Conta nao encontrada.');
    if (!usuario.emailVerifiedAt) {
      throw new ForbiddenException(
        'Confirme seu e-mail antes de finalizar uma compra.',
      );
    }
    if (configuracao?.lojaAberta === false) {
      throw new ServiceUnavailableException(
        'A loja esta temporariamente fechada para novos pedidos.',
      );
    }
    if (!Array.isArray(dados.itens) || dados.itens.length === 0)
      throw new BadRequestException('A sacola esta vazia.');
    if (!dados.entrega || !this.normalizarCep(dados.entrega.cep))
      throw new BadRequestException('Informe um CEP de entrega valido.');
    if (dados.formaPagamento !== 'infinitepay')
      throw new BadRequestException('Forma de pagamento invalida.');

    const nomeEntrega = dados.entrega.nome.trim();
    const emailEntrega = usuario.email.trim().toLowerCase();
    const telefoneEntrega = dados.entrega.telefone.replace(/\D/g, '');
    const numeroEntrega = dados.entrega.numero.trim();
    if (
      !nomeEntrega ||
      !/^\S+@\S+\.\S+$/.test(emailEntrega) ||
      telefoneEntrega.length < 10 ||
      !numeroEntrega
    ) {
      throw new BadRequestException(
        'Revise nome, e-mail, telefone e numero do endereco de entrega.',
      );
    }
    const enderecoValidado = await this.freteService.validarEnderecoEntrega({
      ...dados.entrega,
      nome: nomeEntrega,
      email: emailEntrega,
      telefone: telefoneEntrega,
      numero: numeroEntrega,
    });
    const entregaValidada = {
      ...dados.entrega,
      ...enderecoValidado,
      nome: nomeEntrega,
      email: emailEntrega,
      telefone: telefoneEntrega,
      numero: numeroEntrega,
    };

    const linhas = new Map<
      string,
      { produtoId: string; tamanho: string; quantidade: number }
    >();
    for (const item of dados.itens) {
      const produtoId = item.id.trim();
      const tamanho = this.normalizarTamanho(item.tamanhoEscolhido);
      const quantidade = Number(item.quantidade);
      if (
        !produtoId ||
        !tamanho ||
        !Number.isInteger(quantidade) ||
        quantidade < 1 ||
        quantidade > 20
      ) {
        throw new BadRequestException('Item ou quantidade invalida.');
      }
      const chave = `${produtoId}:${tamanho}`;
      const anterior = linhas.get(chave);
      linhas.set(chave, {
        produtoId,
        tamanho,
        quantidade: (anterior?.quantidade || 0) + quantidade,
      });
    }

    const produtos = await this.prisma.produto.findMany({
      where: {
        id: { in: [...linhas.values()].map((item) => item.produtoId) },
        excluidoEm: null,
      },
    });
    const mapaProdutos = new Map(
      produtos.map((produto) => [produto.id, produto]),
    );
    const itensValidados: ItemPedidoPersistido[] = [];
    let subtotal = 0;

    for (const linha of linhas.values()) {
      const produto = mapaProdutos.get(linha.produtoId);
      if (!produto || produto.oculto || produto.esgotado)
        throw new NotFoundException(
          'Um produto da sacola nao esta mais disponivel.',
        );

      const tamanhos = this.lerTamanhos(produto.tamanhos);
      const tamanho = tamanhos.find((item) => item.label === linha.tamanho);
      const estoqueDisponivel = tamanhos.length
        ? Number(tamanho?.estoque || 0)
        : Number(produto.estoque || 0);
      if (estoqueDisponivel < linha.quantidade) {
        throw new ConflictException(
          `Estoque insuficiente para ${produto.nome} (${linha.tamanho}).`,
        );
      }

      subtotal += Number(produto.preco) * linha.quantidade;
      itensValidados.push({
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco),
        quantidade: linha.quantidade,
        tamanhoEscolhido: linha.tamanho,
        imgUrl: produto.imgUrl,
        pesoKg: Number(produto.pesoKg),
        alturaCm: produto.alturaCm,
        larguraCm: produto.larguraCm,
        comprimentoCm: produto.comprimentoCm,
      });
    }

    const frete = await this.freteService.validarOpcao(
      {
        cep: entregaValidada.cep,
        subtotal,
        itens: itensValidados,
      },
      { ...dados.frete },
    );
    const cupom = dados.cupom?.codigo
      ? await this.cuponsService.validar(dados.cupom.codigo, subtotal)
      : null;
    const desconto = Number(cupom?.descontoAplicado || 0);
    const total =
      Math.round((Math.max(subtotal - desconto, 0) + frete.valor) * 100) / 100;
    if (total < 1) {
      throw new BadRequestException(
        'O cupom cobre todo o pedido. Ajuste o desconto para manter ao menos R$ 1,00 no pagamento.',
      );
    }
    const pedidoId = randomUUID();
    const expiraEmPagamento = new Date(
      Date.now() + this.minutosParaPagamento() * 60_000,
    );
    const reservarPedido = () =>
      this.prisma.$transaction(
        async (tx) => {
          for (const item of itensValidados) {
            const produto = await tx.produto.findUnique({
              where: { id: item.id },
            });
            if (
              !produto ||
              produto.excluidoEm ||
              produto.oculto ||
              produto.esgotado
            )
              throw new ConflictException(
                'Um produto ficou indisponivel durante a compra.',
              );

            const tamanhos = this.lerTamanhos(produto.tamanhos);
            const novosTamanhos = tamanhos;
            if (tamanhos.length) {
              const indice = tamanhos.findIndex(
                (tamanho) => tamanho.label === item.tamanhoEscolhido,
              );
              if (
                indice < 0 ||
                Number(tamanhos[indice]?.estoque || 0) < item.quantidade
              )
                throw new ConflictException(
                  `Estoque insuficiente para ${produto.nome}.`,
                );
              novosTamanhos[indice] = {
                ...tamanhos[indice],
                estoque:
                  Number(tamanhos[indice].estoque || 0) - item.quantidade,
              };
            } else if (Number(produto.estoque || 0) < item.quantidade) {
              throw new ConflictException(
                `Estoque insuficiente para ${produto.nome}.`,
              );
            }

            const estoqueTotal = novosTamanhos.length
              ? novosTamanhos.reduce(
                  (totalEstoque, tamanho) =>
                    totalEstoque + Number(tamanho.estoque || 0),
                  0,
                )
              : Number(produto.estoque || 0) - item.quantidade;
            const atualizado = await tx.produto.updateMany({
              where: { id: produto.id, estoque: { gte: item.quantidade } },
              data: { estoque: estoqueTotal, tamanhos: novosTamanhos },
            });
            if (atualizado.count !== 1)
              throw new ConflictException(
                'O estoque mudou. Atualize a sacola e tente novamente.',
              );
          }

          if (cupom) {
            const cupomAtual = await tx.cupom.findUnique({
              where: { id: cupom.id },
            });
            if (
              !cupomAtual ||
              !cupomAtual.ativo ||
              (cupomAtual.expiraEm && cupomAtual.expiraEm < new Date()) ||
              (cupomAtual.usosMaximos != null &&
                cupomAtual.usosUtilizados >= cupomAtual.usosMaximos)
            ) {
              throw new ConflictException('O cupom nao esta mais disponivel.');
            }
            await tx.cupom.update({
              where: { id: cupom.id },
              data: { usosUtilizados: { increment: 1 } },
            });
          }

          return tx.pedido.create({
            data: {
              id: pedidoId,
              usuarioId,
              itens: itensValidados,
              entrega: entregaValidada,
              formaPagamento: 'infinitepay',
              frete,
              pagamento: {
                provedor: 'infinitepay',
                status: 'criando_checkout',
                orderNsu: pedidoId,
                criadoEm: new Date().toISOString(),
              },
              cupom: cupom || undefined,
              total,
              status: 'aguardando_pagamento',
              expiraEmPagamento,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

    let pedido: Awaited<ReturnType<typeof reservarPedido>> | null = null;
    for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
      try {
        pedido = await reservarPedido();
        break;
      } catch (erro: unknown) {
        if (safeString(asRecord(erro).code) !== 'P2034' || tentativa === 3)
          throw erro;
        this.logger.warn(
          'Conflito ao reservar estoque; repetindo a transacao.',
        );
      }
    }
    if (!pedido)
      throw new ConflictException('Nao foi possivel reservar o estoque agora.');

    let checkout: Awaited<ReturnType<InfinitePayService['criarCheckout']>>;
    try {
      checkout = await this.infinitePayService.criarCheckout({
        orderNsu: pedidoId,
        total,
        entrega: entregaValidada,
        origemPublica,
      });
    } catch (erro) {
      await this.cancelar(pedido.id, 'sistema').catch((falha) => {
        this.logger.error(
          'Falha ao desfazer reserva do pedido ' +
            pedidoId +
            ': ' +
            String(falha),
        );
      });
      throw erro;
    }

    try {
      pedido = await this.prisma.pedido.update({
        where: { id: pedido.id },
        data: { pagamento: checkout.pagamento },
      });
    } catch (erro) {
      // O pedido ja existe e o webhook ainda consegue confirma-lo pelo order_nsu.
      this.logger.error(
        'Checkout criado, mas nao persistido no pedido ' +
          pedidoId +
          ': ' +
          String(erro),
      );
    }

    void this.emailsService
      .pedidoAguardando(pedido, checkout.checkoutUrl)
      .catch((erro) =>
        this.logger.error(
          'Falha ao enfileirar e-mail do pedido: ' + String(erro),
        ),
      );

    return {
      id: pedido.id,
      numeroPedido: pedido.numero,
      status: pedido.status,
      total: Number(pedido.total),
      checkoutUrl: checkout.checkoutUrl,
      expiraEmPagamento: pedido.expiraEmPagamento,
    };
  }

  private normalizarCep(cep: unknown) {
    const numero = safeString(cep).replace(/\D/g, '');
    return numero.length === 8 ? numero : '';
  }

  private formatarPedido(pedido: Pedido) {
    const entrega = asRecord(pedido.entrega);
    return {
      ...pedido,
      total: Number(pedido.total),
      cliente: {
        nome: safeString(entrega.nome),
        email: safeString(entrega.email),
        telefone: safeString(entrega.telefone),
      },
      endereco: {
        cep: safeString(entrega.cep),
        rua: safeString(entrega.rua),
        numero: safeString(entrega.numero),
        complemento: safeString(entrega.complemento),
        bairro: safeString(entrega.bairro),
        cidade: safeString(entrega.cidade),
        estado: safeString(entrega.estado),
      },
    };
  }

  async listarTodos() {
    const pedidos = await this.prisma.pedido.findMany({
      orderBy: { criadoEm: 'desc' },
    });
    return pedidos.map((pedido) => this.formatarPedido(pedido));
  }

  async listarPorUsuario(usuarioId: string) {
    const pedidos = await this.prisma.pedido.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
    });
    return pedidos.map((pedido) => this.formatarPedido(pedido));
  }

  async atualizarStatus(id: string, status: string) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido nao encontrado.');
    if (pedido.status === status) return pedido;

    const transicoesPermitidas: Record<string, string[]> = {
      aguardando_pagamento: ['cancelado'],
      pendente: ['cancelado'],
      pago: ['em_preparacao', 'cancelado'],
      em_preparacao: ['enviado', 'cancelado'],
      enviado: ['entregue'],
      entregue: [],
      cancelado: [],
      pagamento_apos_cancelamento: [],
    };
    if (!transicoesPermitidas[pedido.status]?.includes(status)) {
      throw new BadRequestException(
        'Essa alteracao de status nao e permitida para este pedido.',
      );
    }
    if (status === 'cancelado') return this.cancelar(id, 'admin');

    const atualizado = await this.prisma.pedido.update({
      where: { id },
      data: { status },
    });
    if (
      ['em_preparacao', 'enviado', 'entregue'].includes(status) &&
      pedido.status !== status
    ) {
      void this.emailsService
        .statusPedido(atualizado, status)
        .catch((erro) =>
          this.logger.error(
            'Falha ao enfileirar atualizacao do pedido: ' + String(erro),
          ),
        );
    }
    return atualizado;
  }

  async cancelar(
    id: string,
    origem: 'cliente' | 'admin' | 'expiracao' | 'sistema',
    usuarioId?: string,
  ) {
    const resultado = await this.prisma.$transaction(
      async (tx) => {
        const pedido = await tx.pedido.findUnique({ where: { id } });
        if (!pedido || (usuarioId && pedido.usuarioId !== usuarioId))
          throw new NotFoundException('Pedido nao encontrado.');
        if (pedido.status === 'cancelado')
          return { pedido, restaurado: false, exigeEstorno: false };

        if (origem === 'cliente' && pedido.status !== 'aguardando_pagamento') {
          throw new BadRequestException(
            'O cliente so pode cancelar enquanto o pagamento esta pendente.',
          );
        }
        if (
          origem === 'expiracao' &&
          pedido.status !== 'aguardando_pagamento'
        ) {
          return { pedido, restaurado: false, exigeEstorno: false };
        }
        if (
          origem === 'admin' &&
          ['enviado', 'entregue'].includes(pedido.status)
        ) {
          throw new BadRequestException(
            'Pedido enviado ou entregue exige tratativa manual antes do cancelamento.',
          );
        }

        const pagamento = asRecord(pedido.pagamento);
        const motivo =
          origem === 'expiracao'
            ? 'Prazo de pagamento expirado'
            : origem === 'sistema'
              ? 'Nao foi possivel gerar o checkout'
              : origem === 'cliente'
                ? 'Cancelado pelo cliente'
                : 'Cancelado pela administracao';
        const reservado = await tx.pedido.updateMany({
          where: { id, status: { not: 'cancelado' }, estoqueRestaurado: false },
          data: {
            status: 'cancelado',
            estoqueRestaurado: true,
            pagamento: {
              ...pagamento,
              status: 'cancelado',
              motivoCancelamento: motivo,
              canceladoEm: new Date().toISOString(),
            },
          },
        });
        if (reservado.count !== 1) {
          const atual = await tx.pedido.findUnique({ where: { id } });
          return {
            pedido: atual || pedido,
            restaurado: false,
            exigeEstorno: false,
          };
        }

        const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
        for (const valor of itens) {
          const item = asRecord(valor);
          const quantidade = Math.max(
            0,
            Math.floor(Number(item.quantidade || 0)),
          );
          const produtoId = safeString(item.id);
          if (!produtoId || !quantidade) continue;
          const produto = await tx.produto.findUnique({
            where: { id: produtoId },
          });
          if (!produto) continue;

          const tamanhos = this.lerTamanhos(produto.tamanhos);
          if (tamanhos.length) {
            const tamanhoItem = this.normalizarTamanho(
              item.tamanhoEscolhido || item.tamanho,
            );
            const indice = tamanhos.findIndex(
              (tamanho) => tamanho.label === tamanhoItem,
            );
            if (indice >= 0) {
              tamanhos[indice] = {
                ...tamanhos[indice],
                estoque: Number(tamanhos[indice].estoque || 0) + quantidade,
              };
            } else if (tamanhoItem) {
              tamanhos.push({ label: tamanhoItem, estoque: quantidade });
            }
          }

          await tx.produto.update({
            where: { id: produto.id },
            data: {
              estoque: { increment: quantidade },
              tamanhos,
              esgotado: false,
            },
          });
        }

        const cupomPedido = asRecord(pedido.cupom);
        const cupomId = safeString(cupomPedido.id);
        if (cupomId) {
          await tx.cupom.updateMany({
            where: { id: cupomId, usosUtilizados: { gt: 0 } },
            data: { usosUtilizados: { decrement: 1 } },
          });
        }

        const atualizado = await tx.pedido.findUniqueOrThrow({ where: { id } });
        const exigeEstorno = ['pago', 'em_preparacao'].includes(pedido.status);
        return { pedido: atualizado, restaurado: true, exigeEstorno, motivo };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (resultado.restaurado) {
      void this.emailsService
        .pedidoCancelado(
          resultado.pedido,
          resultado.motivo || 'Pedido cancelado',
        )
        .catch((erro) =>
          this.logger.error(
            'Falha ao enfileirar cancelamento do pedido: ' + String(erro),
          ),
        );
    }

    return {
      ...resultado.pedido,
      estoqueDevolvido: resultado.restaurado,
      avisoEstorno: resultado.exigeEstorno
        ? 'O estoque voltou, mas o pagamento deve ser estornado manualmente no app InfinitePay.'
        : null,
    };
  }

  private async cancelarPedidosExpirados() {
    const expirados = await this.prisma.pedido.findMany({
      where: {
        status: 'aguardando_pagamento',
        estoqueRestaurado: false,
        expiraEmPagamento: { lte: new Date() },
      },
      select: { id: true },
      take: 50,
    });
    for (const pedido of expirados) {
      try {
        await this.cancelar(pedido.id, 'expiracao');
      } catch (erro) {
        this.logger.warn(
          'Falha ao expirar o pedido ' + pedido.id + ': ' + String(erro),
        );
      }
    }
  }
}
