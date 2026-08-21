import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailTokenType, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { CadastroDto } from './auth.dto';

export type SessionMetadata = {
  ip?: string;
  userAgent?: string;
};

export type SessionResult = {
  accessToken: string;
  refreshToken: string;
  usuario: ReturnType<AuthService['usuarioPublico']>;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailsService: EmailsService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private siteUrl() {
    return (process.env.PUBLIC_SITE_URL || 'http://localhost:5173').replace(
      /\/$/,
      '',
    );
  }

  private versaoTermos() {
    return process.env.TERMS_VERSION || '2026-08-20';
  }

  usuarioPublico(
    usuario: Pick<User, 'id' | 'nome' | 'email' | 'role' | 'emailVerifiedAt'>,
  ) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      emailVerificado: Boolean(usuario.emailVerifiedAt),
    };
  }

  private gerarAccessToken(
    usuario: Pick<User, 'id' | 'email' | 'role' | 'tokenVersion'>,
  ) {
    return this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      ver: usuario.tokenVersion,
    });
  }

  private async criarSessao(
    usuario: User,
    metadata: SessionMetadata,
  ): Promise<SessionResult> {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshSession.create({
      data: {
        userId: usuario.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        ip: metadata.ip?.slice(0, 80),
        userAgent: metadata.userAgent?.slice(0, 500),
      },
    });

    void this.prisma.refreshSession
      .deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            {
              revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          ],
        },
      })
      .catch((erro) =>
        this.logger.warn('Falha ao limpar sessoes antigas: ' + String(erro)),
      );

    return {
      accessToken: this.gerarAccessToken(usuario),
      refreshToken,
      usuario: this.usuarioPublico(usuario),
    };
  }

  private async criarTokenEmail(usuario: User, type: EmailTokenType) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() +
        (type === EmailTokenType.EMAIL_VERIFICATION
          ? 24 * 60 * 60 * 1000
          : 30 * 60 * 1000),
    );

    await this.prisma.$transaction([
      this.prisma.emailToken.deleteMany({
        where: { userId: usuario.id, type, usedAt: null },
      }),
      this.prisma.emailToken.create({
        data: {
          userId: usuario.id,
          type,
          tokenHash: this.hashToken(token),
          expiresAt,
        },
      }),
    ]);

    return token;
  }

  async enviarVerificacaoUsuario(usuario: User) {
    const token = await this.criarTokenEmail(
      usuario,
      EmailTokenType.EMAIL_VERIFICATION,
    );
    return this.emailsService.verificarConta(
      usuario,
      this.siteUrl() + '/verificar-email?token=' + encodeURIComponent(token),
    );
  }

  async cadastrar(dados: CadastroDto, metadata: SessionMetadata) {
    if (dados.versaoTermos !== this.versaoTermos()) {
      throw new BadRequestException(
        'As Politicas da Loja foram atualizadas. Recarregue a pagina.',
      );
    }

    const usuarioExiste = await this.prisma.user.findUnique({
      where: { email: dados.email },
    });
    if (usuarioExiste) throw new BadRequestException('E-mail ja cadastrado.');

    const agora = new Date();
    const usuario = await this.prisma.user.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: await bcrypt.hash(dados.senha, 12),
        role: 'CLIENTE',
        termsAcceptedAt: agora,
        termsVersion: dados.versaoTermos,
        marketingConsentAt: dados.aceitouMarketing ? agora : null,
        preferenciasConta: {
          novidadesEmail: Boolean(dados.aceitouMarketing),
          statusPedidoEmail: true,
        },
      },
    });

    void this.enviarVerificacaoUsuario(usuario).catch((erro) =>
      this.logger.error(
        'Falha ao preparar verificacao de e-mail: ' + String(erro),
      ),
    );

    return this.criarSessao(usuario, metadata);
  }

  async login(email: string, senhaPlana: string, metadata: SessionMetadata) {
    const emailNormalizado = String(email || '')
      .trim()
      .toLowerCase();
    const senha = String(senhaPlana || '');
    const usuario = await this.prisma.user.findUnique({
      where: { email: emailNormalizado },
    });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    return this.criarSessao(usuario, metadata);
  }

  async renovar(refreshToken: string, metadata: SessionMetadata) {
    if (!refreshToken) throw new UnauthorizedException('Sessao expirada.');
    const tokenHash = this.hashToken(refreshToken);
    const sessao = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!sessao || sessao.expiresAt <= new Date()) {
      throw new UnauthorizedException('Sessao expirada.');
    }
    if (sessao.revokedAt) {
      if (Date.now() - sessao.revokedAt.getTime() > 10_000) {
        await this.prisma.refreshSession.updateMany({
          where: { userId: sessao.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Sessao reutilizada. Entre novamente.');
    }

    const novoToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const rotacionada = await this.prisma.$transaction(async (tx) => {
      const reserva = await tx.refreshSession.updateMany({
        where: {
          id: sessao.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date(), lastUsedAt: new Date() },
      });
      if (reserva.count !== 1) return false;
      await tx.refreshSession.create({
        data: {
          userId: sessao.userId,
          tokenHash: this.hashToken(novoToken),
          expiresAt,
          ip: metadata.ip?.slice(0, 80),
          userAgent: metadata.userAgent?.slice(0, 500),
        },
      });
      return true;
    });

    if (!rotacionada) {
      const atual = await this.prisma.refreshSession.findUnique({
        where: { id: sessao.id },
        select: { revokedAt: true },
      });
      if (atual?.revokedAt && Date.now() - atual.revokedAt.getTime() > 10_000) {
        await this.prisma.refreshSession.updateMany({
          where: { userId: sessao.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Sessao reutilizada. Entre novamente.');
    }

    return {
      accessToken: this.gerarAccessToken(sessao.user),
      refreshToken: novoToken,
      usuario: this.usuarioPublico(sessao.user),
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { sucesso: true };
  }

  async verificarEmail(token: string) {
    const registro = await this.prisma.emailToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (
      !registro ||
      registro.type !== EmailTokenType.EMAIL_VERIFICATION ||
      registro.usedAt ||
      registro.expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        'Link de verificacao invalido ou expirado.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const consumido = await tx.emailToken.updateMany({
        where: { id: registro.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumido.count !== 1) {
        throw new BadRequestException(
          'Link de verificacao ja utilizado ou expirado.',
        );
      }
      await tx.user.update({
        where: { id: registro.userId },
        data: { emailVerifiedAt: new Date() },
      });
    });
    return { sucesso: true };
  }

  async reenviarVerificacao(email: string) {
    const usuario = await this.prisma.user.findUnique({ where: { email } });
    if (usuario && !usuario.emailVerifiedAt) {
      void this.enviarVerificacaoUsuario(usuario).catch((erro) =>
        this.logger.error(
          'Falha ao reenviar verificacao de e-mail: ' + String(erro),
        ),
      );
    }
    return {
      sucesso: true,
      mensagem: 'Se a conta existir, o e-mail sera enviado.',
    };
  }

  async solicitarRecuperacao(email: string) {
    const usuario = await this.prisma.user.findUnique({ where: { email } });
    if (usuario) {
      const token = await this.criarTokenEmail(
        usuario,
        EmailTokenType.PASSWORD_RESET,
      );
      void this.emailsService
        .recuperarSenha(
          usuario,
          this.siteUrl() +
            '/redefinir-senha?token=' +
            encodeURIComponent(token),
        )
        .catch((erro) =>
          this.logger.error(
            'Falha ao enfileirar recuperacao de senha: ' + String(erro),
          ),
        );
    }
    return {
      sucesso: true,
      mensagem: 'Se a conta existir, o e-mail sera enviado.',
    };
  }

  async redefinirSenha(token: string, novaSenha: string) {
    const registro = await this.prisma.emailToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (
      !registro ||
      registro.type !== EmailTokenType.PASSWORD_RESET ||
      registro.usedAt ||
      registro.expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        'Link de recuperacao invalido ou expirado.',
      );
    }

    const senha = await bcrypt.hash(novaSenha, 12);
    await this.prisma.$transaction(async (tx) => {
      const consumido = await tx.emailToken.updateMany({
        where: { id: registro.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumido.count !== 1) {
        throw new BadRequestException(
          'Link de recuperacao ja utilizado ou expirado.',
        );
      }
      await tx.user.update({
        where: { id: registro.userId },
        data: { senha, tokenVersion: { increment: 1 } },
      });
      await tx.refreshSession.updateMany({
        where: { userId: registro.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.emailToken.updateMany({
        where: {
          userId: registro.userId,
          type: EmailTokenType.PASSWORD_RESET,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
    });
    return { sucesso: true };
  }
}
