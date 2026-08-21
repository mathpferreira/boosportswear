import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AtualizarContaDto } from './minha-conta.dto';
import { asRecord, safeString } from '../common/utils/value';

@Injectable()
export class MinhaContaService {
  private readonly logger = new Logger(MinhaContaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private normalizarConta(usuario: User) {
    const preferencias = asRecord(usuario.preferenciasConta);
    const endereco = asRecord(usuario.enderecoPadrao);
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      emailVerificado: Boolean(usuario.emailVerifiedAt),
      telefone: usuario.telefone || '',
      enderecoPadrao: {
        cep: safeString(endereco.cep),
        rua: safeString(endereco.rua),
        numero: safeString(endereco.numero),
        complemento: safeString(endereco.complemento),
        bairro: safeString(endereco.bairro),
        cidade: safeString(endereco.cidade),
        estado: safeString(endereco.estado),
      },
      preferenciasConta: {
        novidadesEmail: Boolean(preferencias.novidadesEmail),
        statusPedidoEmail: preferencias.statusPedidoEmail !== false,
      },
    };
  }

  async obter(usuarioId: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) throw new NotFoundException('Conta nao encontrada.');
    return this.normalizarConta(usuario);
  }

  private normalizarEndereco(valor: unknown) {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor))
      return undefined;
    const dados = valor as Record<string, unknown>;
    const cep = safeString(dados.cep).replace(/\D/g, '');
    if (cep && cep.length !== 8)
      throw new BadRequestException('Informe um CEP valido.');
    const campo = (nome: string, limite: number) =>
      safeString(dados[nome]).trim().slice(0, limite);
    return {
      cep,
      rua: campo('rua', 180),
      numero: campo('numero', 30),
      complemento: campo('complemento', 120),
      bairro: campo('bairro', 120),
      cidade: campo('cidade', 120),
      estado: campo('estado', 2).toUpperCase(),
    };
  }

  async atualizar(usuarioId: string, dados: AtualizarContaDto) {
    const atual = await this.prisma.user.findUnique({
      where: { id: usuarioId },
    });
    if (!atual) throw new NotFoundException('Conta nao encontrada.');

    const nome =
      dados.nome === undefined ? undefined : String(dados.nome).trim();
    const email =
      dados.email === undefined
        ? undefined
        : String(dados.email).trim().toLowerCase();
    if (nome !== undefined && (nome.length < 2 || nome.length > 120)) {
      throw new BadRequestException('Informe um nome valido.');
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Informe um e-mail valido.');
    }

    const mudouEmail = Boolean(email && email !== atual.email);
    if (mudouEmail) {
      const senhaCorreta =
        dados.senhaAtual &&
        (await bcrypt.compare(dados.senhaAtual, atual.senha));
      if (!senhaCorreta) {
        throw new UnauthorizedException(
          'Informe sua senha atual para alterar o e-mail.',
        );
      }
      const emailEmUso = await this.prisma.user.findUnique({
        where: { email },
      });
      if (emailEmUso && emailEmUso.id !== usuarioId) {
        throw new BadRequestException('Este e-mail ja esta em uso.');
      }
    }

    const telefone =
      dados.telefone === undefined
        ? undefined
        : String(dados.telefone || '').replace(/\D/g, '');
    if (telefone && (telefone.length < 10 || telefone.length > 13)) {
      throw new BadRequestException('Informe um telefone valido.');
    }

    const preferencias =
      dados.preferenciasConta === undefined
        ? undefined
        : {
            novidadesEmail: Boolean(dados.preferenciasConta.novidadesEmail),
            statusPedidoEmail:
              dados.preferenciasConta.statusPedidoEmail !== false,
          };

    const usuario = await this.prisma.user.update({
      where: { id: usuarioId },
      data: {
        nome,
        email,
        emailVerifiedAt: mudouEmail ? null : undefined,
        telefone,
        enderecoPadrao: this.normalizarEndereco(dados.enderecoPadrao),
        preferenciasConta: preferencias,
        marketingConsentAt:
          preferencias === undefined
            ? undefined
            : preferencias.novidadesEmail
              ? atual.marketingConsentAt || new Date()
              : null,
      },
    });

    if (mudouEmail) {
      void this.authService
        .enviarVerificacaoUsuario(usuario)
        .catch((erro) =>
          this.logger.error(
            'Falha ao enfileirar verificacao do novo e-mail: ' + String(erro),
          ),
        );
    }
    return this.normalizarConta(usuario);
  }
}
