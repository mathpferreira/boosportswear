import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MinhaContaService {
  constructor(private prisma: PrismaService) {}

  private normalizarConta(usuario: any) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone || '',
      enderecoPadrao: usuario.enderecoPadrao || {
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
      },
      preferenciasConta: usuario.preferenciasConta || {
        novidadesEmail: true,
        statusPedidoWhatsApp: true,
        statusPedidoEmail: true,
      },
    };
  }

  async obter(usuarioId: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        enderecoPadrao: true,
        preferenciasConta: true,
      },
    });
    return this.normalizarConta(usuario);
  }

  async atualizar(
    usuarioId: string,
    dados: {
      nome?: string;
      email?: string;
      telefone?: string;
      enderecoPadrao?: {
        cep?: string;
        rua?: string;
        numero?: string;
        complemento?: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
      };
      preferenciasConta?: {
        novidadesEmail?: boolean;
        statusPedidoWhatsApp?: boolean;
        statusPedidoEmail?: boolean;
      };
    },
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
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        enderecoPadrao: dados.enderecoPadrao,
        preferenciasConta: dados.preferenciasConta,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        enderecoPadrao: true,
        preferenciasConta: true,
      },
    });

    return this.normalizarConta(usuario);
  }
}
