import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  async listarPorUsuario(usuarioId: string) {
    return this.prisma.pedido.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
    });
  }
}