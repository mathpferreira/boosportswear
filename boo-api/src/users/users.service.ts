import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Lista todos os usuários, sem expor a senha (hash)
  async listar() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Troca o role de um usuário (CLIENTE <-> ADMIN)
  async atualizarRole(id: string, role: 'ADMIN' | 'CLIENTE', usuarioLogadoId: string) {
    if (!['ADMIN', 'CLIENTE'].includes(role)) {
      throw new BadRequestException('Role inválida. Use ADMIN ou CLIENTE.');
    }

    const usuario = await this.prisma.user.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Impede que o admin logado remova o próprio acesso de admin sem querer
    if (id === usuarioLogadoId && role !== 'ADMIN') {
      throw new BadRequestException('Você não pode remover seu próprio acesso de administrador.');
    }

    const atualizado = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
    });

    return atualizado;
  }
}
