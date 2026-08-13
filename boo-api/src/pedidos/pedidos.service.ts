import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CuponsService } from '../cupons/cupons.service';
import { FreteService } from '../frete/frete.service';

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cuponsService: CuponsService,
    private readonly freteService: FreteService,
  ) {}

  private normalizarTamanho(label: unknown) {
    const texto = String(label || '').trim();
    return texto.toLowerCase().includes('nico') ? 'U' : texto;
  }

  async criar(dados: any, usuarioId: string) {
    if (!usuarioId) throw new BadRequestException('E necessario estar logado para comprar.');
    if (!Array.isArray(dados?.itens) || dados.itens.length === 0) throw new BadRequestException('A sacola esta vazia.');
    if (!dados?.entrega || !this.normalizarCep(dados.entrega.cep)) throw new BadRequestException('Informe um CEP de entrega valido.');
    if (!['pix', 'cartao'].includes(dados.formaPagamento)) throw new BadRequestException('Forma de pagamento invalida.');

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
      cep: dados.entrega.cep,
      subtotal,
      itens: itensValidados,
    }, dados.frete);
    const cupom = dados.cupom?.codigo ? await this.cuponsService.validar(dados.cupom.codigo, subtotal) : null;
    const desconto = Number(cupom?.descontoAplicado || 0);
    const total = Math.max(subtotal - desconto, 0) + frete.valor;

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
          usuarioId,
          itens: itensValidados,
          entrega: dados.entrega,
          formaPagamento: dados.formaPagamento,
          frete,
          total,
          status: 'aguardando_pagamento',
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return { id: pedido.id, numeroPedido: pedido.numero, status: pedido.status, total: pedido.total };
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
    const statusPermitidos = ['aguardando_pagamento', 'pendente', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
    if (!statusPermitidos.includes(status)) throw new BadRequestException('Status de pedido invalido.');
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido nao encontrado.');
    return this.prisma.pedido.update({ where: { id }, data: { status } });
  }
}
