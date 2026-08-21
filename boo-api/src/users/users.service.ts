import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { asRecord, safeString } from '../common/utils/value';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private mascararCpf(cpf: string | null) {
    const numeros = String(cpf || '').replace(/\D/g, '');
    return numeros.length === 11 ? '***.***.***-' + numeros.slice(-2) : null;
  }

  async listar(input: {
    pagina?: number;
    limite?: number;
    busca?: string;
    ordenacao?: string;
  }) {
    const pagina = Math.max(1, Math.floor(Number(input.pagina) || 1));
    const limite = Math.min(
      100,
      Math.max(10, Math.floor(Number(input.limite) || 50)),
    );
    const busca = String(input.busca || '')
      .trim()
      .slice(0, 120);
    const where: Prisma.UserWhereInput = busca
      ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { email: { contains: busca, mode: 'insensitive' } },
          ],
        }
      : {};
    const orderBy:
      | Prisma.UserOrderByWithRelationInput
      | Prisma.UserOrderByWithRelationInput[] =
      input.ordenacao === 'admin-first'
        ? [{ role: 'asc' }, { createdAt: 'desc' }]
        : input.ordenacao === 'nome'
          ? { nome: 'asc' }
          : input.ordenacao === 'antigos'
            ? { createdAt: 'asc' }
            : { createdAt: 'desc' };

    const [usuarios, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          cpf: true,
          telefone: true,
          role: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
        orderBy,
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      itens: usuarios.map((usuario) => ({
        ...usuario,
        cpf: this.mascararCpf(usuario.cpf),
        emailVerificado: Boolean(usuario.emailVerifiedAt),
        emailVerifiedAt: undefined,
      })),
      total,
      pagina,
      limite,
      paginas: Math.max(1, Math.ceil(total / limite)),
    };
  }

  async atualizarRole(
    id: string,
    role: 'ADMIN' | 'CLIENTE',
    usuarioLogadoId: string,
  ) {
    if (!['ADMIN', 'CLIENTE'].includes(role)) {
      throw new BadRequestException('Role invalida. Use ADMIN ou CLIENTE.');
    }
    if (id === usuarioLogadoId && role !== 'ADMIN') {
      throw new BadRequestException(
        'Voce nao pode remover seu proprio acesso de administrador.',
      );
    }

    const alterar = () =>
      this.prisma.$transaction(
        async (tx) => {
          const usuario = await tx.user.findUnique({ where: { id } });
          if (!usuario) throw new NotFoundException('Usuario nao encontrado.');
          if (usuario.role === 'ADMIN' && role === 'CLIENTE') {
            const administradores = await tx.user.count({
              where: { role: 'ADMIN' },
            });
            if (administradores <= 1) {
              throw new BadRequestException(
                'A loja precisa manter ao menos um administrador.',
              );
            }
          }
          return tx.user.update({
            where: { id },
            data: { role },
            select: { id: true, nome: true, email: true, role: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

    for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
      try {
        return await alterar();
      } catch (erro: unknown) {
        if (safeString(asRecord(erro).code) !== 'P2034' || tentativa === 3)
          throw erro;
      }
    }
    throw new BadRequestException('Nao foi possivel atualizar o acesso agora.');
  }
}
