import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CookieRequest } from '../../common/types/request';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  ver: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          const req = request as CookieRequest;
          return (
            String(
              req.cookies?.['__Host-boo_access'] ||
                req.cookies?.boo_access ||
                '',
            ) || null
          );
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        (process.env.NODE_ENV === 'production'
          ? (() => {
              throw new Error('JWT_SECRET e obrigatorio em producao');
            })()
          : 'boo-development-only-secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!usuario || payload.ver !== usuario.tokenVersion) {
      throw new UnauthorizedException(
        'Usuário não encontrado ou token inválido.',
      );
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      emailVerificado: Boolean(usuario.emailVerifiedAt),
    };
  }
}
