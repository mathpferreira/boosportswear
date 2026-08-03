import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'boo_secret_key_123',
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado ou token inválido.');
    }

    return { id: usuario.id, email: usuario.email, role: usuario.role };
  }
}