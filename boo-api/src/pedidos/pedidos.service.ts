import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  async criar(dados: {
    usuarioId?: string | null;
    itens: any[];
    entrega: any;
    formaPagamento: string;
    frete?: any;
    total: number;
    cupom?: any;
  }) {
    const pedido = await this.prisma.pedido.create({
      data: {
        usuarioId: dados.usuarioId || null,
        itens: dados.itens || [],
        entrega: dados.entrega || {},
        formaPagamento: dados.formaPagamento,
        frete: dados.frete || null,
        total: Number(dados.total || 0),
        status: 'aguardando_pagamento',
      },
    });

    return {
      id: pedido.id,
      numeroPedido: pedido.numero,
      status: pedido.status,
    };
  }

  async listarTodos() {
    return this.prisma.pedido.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  async listarPorUsuario(usuarioId: string) {
    return this.prisma.pedido.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async atualizarStatus(id: string, status: string) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    return this.prisma.pedido.update({
      where: { id },
      data: { status },
    });
  }
}
