import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('JWT_SECRET e obrigatorio em producao'); })()
        : 'boo-development-only-secret'),
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  // Exportamos o JwtModule e o PassportModule para que outros módulos
  // (ex: ProdutosModule, PedidosModule) possam usar o JwtAuthGuard sem
  // precisar reconfigurar o JWT em cada um.
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
