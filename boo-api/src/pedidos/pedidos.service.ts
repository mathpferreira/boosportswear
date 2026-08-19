import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CuponsService } from '../cupons/cupons.service';
import { FreteService } from '../frete/frete.service';
import { InfinitePayService } from '../pagamentos/infinitepay.service';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class PedidosService implements OnModuleInit, OnModuleDestroy {
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
    return Number.isFinite(minutos) && minutos >= 10 && minutos <= 1440 ? Math.floor(minutos) : 30;
  }

  private normalizarTamanho(label: unknown) {
    const texto = String(label || '').trim();
    return texto.toLowerCase().includes('nico') ? 'U' : texto;
  }

  async criar(dados: any, usuarioId: string, origemPublica: string) {
    if (!usuarioId) throw new BadRequestException('E necessario estar logado para comprar.');
    if (!Array.isArray(dados?.itens) || dados.itens.length === 0) throw new BadRequestException('A sacola esta vazia.');
    if (!dados?.entrega || !this.normalizarCep(dados.entrega.cep)) throw new BadRequestException('Informe um CEP de entrega valido.');
    if (dados.formaPagamento !== 'infinitepay') throw new BadRequestException('Forma de pagamento invalida.');

    const nomeEntrega = String(dados.entrega.nome || '').trim();
    const emailEntrega = String(dados.entrega.email || '').trim().toLowerCase();
    const telefoneEntrega = String(dados.entrega.telefone || '').replace(/\D/g, '');
    const numeroEntrega = String(dados.entrega.numero || '').trim();
    if (!nomeEntrega || !/^\S+@\S+\.\S+$/.test(emailEntrega) || telefoneEntrega.length < 10 || !numeroEntrega) {
      throw new BadRequestException('Revise nome, e-mail, telefone e numero do endereco de entrega.');
    }
    const entregaValidada = await this.freteService.validarEnderecoEntrega({
      ...dados.entrega,
      nome: nomeEntrega,
      email: emailEntrega,
      telefone: telefoneEntrega,
      numero: numeroEntrega,
    });

    const linhas = new Map<string, { produtoId: string; tamanho: string; quantidade: number }>();
    for (const item of dados.itens) {
      const produtoId = String(item?.id || '').trim();
      const tamanho = this.normalizarTamanho(item?.tamanhoEscolhido || item?.tamanho);
      const quantidade = Number(item?.quantidade);
      if (!produtoId || !tamanho || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
        throw new BadRequestException('Item ou quantidade invalida.');
      }
      const chave = `${produtoId}:${tamanho}`;
      const anterior = linhas.get(chave);
      linhas.set(chave, { produtoId, tamanho, quantidade: (anterior?.quantidade || 0) + quantidade });
    }

    const produtos = await this.prisma.produto.findMany({ where: { id: { in: [...linhas.values()].map((item) => item.produtoId) } } });
    const mapaProdutos = new Map(produtos.map((produto) => [produto.id, produto]));
    const itensValidados: any[] = [];
    let subtotal = 0;

    for (const linha of linhas.values()) {
      const produto = mapaProdutos.get(linha.produtoId);
      if (!produto || produto.oculto || produto.esgotado) throw new NotFoundException('Um produto da sacola nao esta mais disponivel.');

      const tamanhos = Array.isArray(produto.tamanhos) ? produto.tamanhos as any[] : [];
      const tamanho = tamanhos.find((item) => this.normalizarTamanho(item?.label) === linha.tamanho);
      const estoqueDisponivel = tamanhos.length ? Number(tamanho?.estoque || 0) : Number(produto.estoque || 0);
      if (estoqueDisponivel < linha.quantidade) {
        throw new ConflictException(`Estoque insuficiente para ${produto.nome} (${linha.tamanho}).`);
      }

      subtotal += Number(produto.preco) * linha.quantidade;
      itensValidados.push({
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco),
        quantidade: linha.quantidade,
        tamanhoEscolhido: linha.tamanho,
        imgUrl: produto.imgUrl,
      });
    }

    const frete = await this.freteService.validarOpcao({
      cep: entregaValidada.cep,
      subtotal,
      itens: itensValidados,
    }, dados.frete);
    const cupom = dados.cupom?.codigo ? await this.cuponsService.validar(dados.cupom.codigo, subtotal) : null;
    const desconto = Number(cupom?.descontoAplicado || 0);
    const total = Math.max(subtotal - desconto, 0) + frete.valor;
    const pedidoId = randomUUID();
    const expiraEmPagamento = new Date(Date.now() + this.minutosParaPagamento() * 60_000);
    const checkout = await this.infinitePayService.criarCheckout({
      orderNsu: pedidoId,
      total,
      entrega: entregaValidada,
      origemPublica,
    });

    const pedido = await this.prisma.$transaction(async (tx) => {
      for (const item of itensValidados) {
        const produto = await tx.produto.findUnique({ where: { id: item.id } });
        if (!produto || produto.oculto || produto.esgotado) throw new ConflictException('Um produto ficou indisponivel durante a compra.');

        const tamanhos = Array.isArray(produto.tamanhos) ? [...produto.tamanhos] as any[] : [];
        let novosTamanhos = tamanhos;
        if (tamanhos.length) {
          const indice = tamanhos.findIndex((tamanho) => this.normalizarTamanho(tamanho?.label) === item.tamanhoEscolhido);
          if (indice < 0 || Number(tamanhos[indice]?.estoque || 0) < item.quantidade) throw new ConflictException(`Estoque insuficiente para ${produto.nome}.`);
          novosTamanhos[indice] = { ...tamanhos[indice], estoque: Number(tamanhos[indice].estoque || 0) - item.quantidade };
        } else if (Number(produto.estoque || 0) < item.quantidade) {
          throw new ConflictException(`Estoque insuficiente para ${produto.nome}.`);
        }

        const estoqueTotal = novosTamanhos.length
          ? novosTamanhos.reduce((totalEstoque, tamanho) => totalEstoque + Number(tamanho.estoque || 0), 0)
          : Number(produto.estoque || 0) - item.quantidade;
        const atualizado = await tx.produto.updateMany({
          where: { id: produto.id, estoque: { gte: item.quantidade } },
          data: { estoque: estoqueTotal, tamanhos: novosTamanhos },
        });
        if (atualizado.count !== 1) throw new ConflictException('O estoque mudou. Atualize a sacola e tente novamente.');
      }

      if (cupom) {
        const cupomAtual = await tx.cupom.findUnique({ where: { id: cupom.id } });
        if (!cupomAtual || !cupomAtual.ativo || (cupomAtual.expiraEm && cupomAtual.expiraEm < new Date()) || (cupomAtual.usosMaximos != null && cupomAtual.usosUtilizados >= cupomAtual.usosMaximos)) {
          throw new ConflictException('O cupom nao esta mais disponivel.');
        }
        await tx.cupom.update({ where: { id: cupom.id }, data: { usosUtilizados: { increment: 1 } } });
      }

      return tx.pedido.create({
        data: {
          id: pedidoId,
          usuarioId,
          itens: itensValidados,
          entrega: entregaValidada,
          formaPagamento: 'infinitepay',
          frete,
          pagamento: checkout.pagamento,
          cupom: cupom || undefined,
          total,
          status: 'aguardando_pagamento',
          expiraEmPagamento,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    void this.emailsService.pedidoAguardando(pedido, checkout.checkoutUrl);

    return {
      id: pedido.id,
      numeroPedido: pedido.numero,
      status: pedido.status,
      total: pedido.total,
      checkoutUrl: checkout.checkoutUrl,
      expiraEmPagamento: pedido.expiraEmPagamento,
    };
  }

  private normalizarCep(cep: unknown) {
    const numero = String(cep || '').replace(/\D/g, '');
    return numero.length === 8 ? numero : '';
  }

  async listarTodos() {
    return this.prisma.pedido.findMany({ orderBy: { criadoEm: 'desc' } });
  }

  async listarPorUsuario(usuarioId: string) {
    return this.prisma.pedido.findMany({ where: { usuarioId }, orderBy: { criadoEm: 'desc' } });
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
      throw new BadRequestException('Essa alteracao de status nao e permitida para este pedido.');
    }
    if (status === 'cancelado') return this.cancelar(id, 'admin');

    const atualizado = await this.prisma.pedido.update({ where: { id }, data: { status } });
    if (['em_preparacao', 'enviado', 'entregue'].includes(status) && pedido.status !== status) {
      void this.emailsService.statusPedido(atualizado, status);
    }
    return atualizado;
  }

  async cancelar(id: string, origem: 'cliente' | 'admin' | 'expiracao', usuarioId?: string) {
    const resultado = await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({ where: { id } });
      if (!pedido || (usuarioId && pedido.usuarioId !== usuarioId)) throw new NotFoundException('Pedido nao encontrado.');
      if (pedido.status === 'cancelado') return { pedido, restaurado: false, exigeEstorno: false };

      if (origem === 'cliente' && pedido.status !== 'aguardando_pagamento') {
        throw new BadRequestException('O cliente so pode cancelar enquanto o pagamento esta pendente.');
      }
      if (origem === 'expiracao' && pedido.status !== 'aguardando_pagamento') {
        return { pedido, restaurado: false, exigeEstorno: false };
      }
      if (origem === 'admin' && ['enviado', 'entregue'].includes(pedido.status)) {
        throw new BadRequestException('Pedido enviado ou entregue exige tratativa manual antes do cancelamento.');
      }

      const pagamento = pedido.pagamento && typeof pedido.pagamento === 'object' && !Array.isArray(pedido.pagamento)
        ? pedido.pagamento as Record<string, any>
        : {};
      const motivo = origem === 'expiracao'
        ? 'Prazo de pagamento expirado'
        : origem === 'cliente' ? 'Cancelado pelo cliente' : 'Cancelado pela administracao';
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
        return { pedido: atual || pedido, restaurado: false, exigeEstorno: false };
      }

      const itens = Array.isArray(pedido.itens) ? pedido.itens as any[] : [];
      for (const item of itens) {
        const quantidade = Math.max(0, Math.floor(Number(item?.quantidade || 0)));
        if (!item?.id || !quantidade) continue;
        const produto = await tx.produto.findUnique({ where: { id: String(item.id) } });
        if (!produto) continue;

        const tamanhos = Array.isArray(produto.tamanhos) ? [...produto.tamanhos] as any[] : [];
        if (tamanhos.length) {
          const tamanhoItem = this.normalizarTamanho(item.tamanhoEscolhido || item.tamanho);
          const indice = tamanhos.findIndex((tamanho) => this.normalizarTamanho(tamanho?.label) === tamanhoItem);
          if (indice >= 0) {
            tamanhos[indice] = { ...tamanhos[indice], estoque: Number(tamanhos[indice].estoque || 0) + quantidade };
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

      const cupomPedido = pedido.cupom && typeof pedido.cupom === 'object' && !Array.isArray(pedido.cupom)
        ? pedido.cupom as Record<string, any>
        : null;
      if (cupomPedido?.id) {
        await tx.cupom.updateMany({
          where: { id: String(cupomPedido.id), usosUtilizados: { gt: 0 } },
          data: { usosUtilizados: { decrement: 1 } },
        });
      }

      const atualizado = await tx.pedido.findUniqueOrThrow({ where: { id } });
      const exigeEstorno = ['pago', 'em_preparacao'].includes(pedido.status);
      return { pedido: atualizado, restaurado: true, exigeEstorno, motivo };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (resultado.restaurado) {
      void this.emailsService.pedidoCancelado(resultado.pedido, resultado.motivo || 'Pedido cancelado');
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
      } catch {
        // A proxima verificacao tenta novamente em caso de concorrencia transacional.
      }
    }
  }
}
