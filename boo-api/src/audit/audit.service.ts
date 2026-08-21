import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditActor = {
  id?: string;
  nome?: string;
  email?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(input: {
    actor?: AuditActor;
    acao: string;
    entidade: string;
    entidadeId?: string;
    detalhes?: Record<string, unknown>;
    ip?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actor?.id || null,
          actorNome: input.actor?.nome || input.actor?.email || 'Sistema',
          acao: input.acao.slice(0, 160),
          entidade: input.entidade.slice(0, 80),
          entidadeId: input.entidadeId?.slice(0, 160) || null,
          detalhes: (input.detalhes || undefined) as
            Prisma.InputJsonValue | undefined,
          ip: input.ip?.slice(0, 80) || null,
        },
      });
    } catch {
      // Auditoria nunca pode derrubar a operacao principal.
    }
  }

  async listar(input: { pagina?: number; limite?: number; busca?: string }) {
    const pagina = Math.max(1, Math.floor(Number(input.pagina) || 1));
    const limite = Math.min(
      100,
      Math.max(10, Math.floor(Number(input.limite) || 50)),
    );
    const busca = String(input.busca || '')
      .trim()
      .slice(0, 120);
    const where: Prisma.AuditLogWhereInput = busca
      ? {
          OR: [
            { actorNome: { contains: busca, mode: 'insensitive' } },
            { acao: { contains: busca, mode: 'insensitive' } },
            { entidade: { contains: busca, mode: 'insensitive' } },
            { entidadeId: { contains: busca, mode: 'insensitive' } },
          ],
        }
      : {};

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      itens,
      total,
      pagina,
      limite,
      paginas: Math.max(1, Math.ceil(total / limite)),
    };
  }
}
