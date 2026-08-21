import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type {
  AuthenticatedRequest,
  CookieRequest,
} from '../common/types/request';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService, SessionResult } from './auth.service';
import {
  CadastroDto,
  EmailDto,
  LoginDto,
  RedefinirSenhaDto,
  TokenDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private cookieName(tipo: 'access' | 'refresh') {
    const prefixo = process.env.NODE_ENV === 'production' ? '__Host-' : '';
    return `${prefixo}boo_${tipo}`;
  }

  private metadata(req: Pick<Request, 'ip' | 'get'>) {
    return {
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    };
  }

  private cookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge,
    };
  }

  private aplicarSessao(res: Response, sessao: SessionResult) {
    res.setHeader('Cache-Control', 'no-store');
    res.cookie(
      this.cookieName('access'),
      sessao.accessToken,
      this.cookieOptions(15 * 60 * 1000),
    );
    res.cookie(
      this.cookieName('refresh'),
      sessao.refreshToken,
      this.cookieOptions(30 * 24 * 60 * 60 * 1000),
    );
    return { usuario: sessao.usuario };
  }

  @Post('cadastro')
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  async cadastrar(
    @Body() body: CadastroDto,
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessao = await this.authService.cadastrar(body, this.metadata(req));
    return {
      ...this.aplicarSessao(res, sessao),
      precisaVerificarEmail: true,
    };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 10 * 60 * 1000 } })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessao = await this.authService.login(
      body.email,
      body.senha,
      this.metadata(req),
    );
    return this.aplicarSessao(res, sessao);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  async refresh(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = String(
      req.cookies?.[this.cookieName('refresh')] ||
        req.cookies?.boo_refresh ||
        '',
    );
    const sessao = await this.authService.renovar(token, this.metadata(req));
    return this.aplicarSessao(res, sessao);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = String(
      req.cookies?.[this.cookieName('refresh')] ||
        req.cookies?.boo_refresh ||
        '',
    );
    await this.authService.logout(token);
    res.clearCookie(this.cookieName('access'), this.cookieOptions(0));
    res.clearCookie(this.cookieName('refresh'), this.cookieOptions(0));
    res.clearCookie('boo_access', this.cookieOptions(0));
    res.clearCookie('boo_refresh', this.cookieOptions(0));
    res.clearCookie('boo_refresh', {
      ...this.cookieOptions(0),
      path: '/api/auth',
    });
    return { sucesso: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return { usuario: req.user };
  }

  @Post('verificar-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  verificarEmail(@Body() body: TokenDto) {
    return this.authService.verificarEmail(body.token);
  }

  @Post('reenviar-verificacao')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  reenviarVerificacao(@Body() body: EmailDto) {
    return this.authService.reenviarVerificacao(body.email);
  }

  @Post('esqueci-senha')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  esqueciSenha(@Body() body: EmailDto) {
    return this.authService.solicitarRecuperacao(body.email);
  }

  @Post('redefinir-senha')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  redefinirSenha(@Body() body: RedefinirSenhaDto) {
    return this.authService.redefinirSenha(body.token, body.novaSenha);
  }
}
