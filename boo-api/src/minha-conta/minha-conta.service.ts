import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MinhaContaService {
  constructor(private prisma: PrismaService) {}

  async obter(usuarioId: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: usuarioId },
      select: { id: true, nome: true, email: true, telefone: true },
    });
    return usuario;
  }

  async atualizar(
    usuarioId: string,
    dados: { nome?: string; email?: string; telefone?: string },
  ) {
    if (dados.email) {
      const emailEmUso = await this.prisma.user.findUnique({
        where: { email: dados.email },
      });
      if (emailEmUso && emailEmUso.id !== usuarioId) {
        throw new BadRequestException('Este e-mail já está em uso.');
      }
    }

    const usuario = await this.prisma.user.update({
      where: { id: usuarioId },
      data: dados,
      select: { id: true, nome: true, email: true, telefone: true },
    });

    return usuario;
  }
}