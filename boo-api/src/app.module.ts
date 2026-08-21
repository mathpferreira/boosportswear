import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProdutosModule } from './produtos/produtos.module';
import { AuthModule } from './auth/auth.module';
import { CategoriasModule } from './categorias/categorias.module';
import { UsersModule } from './users/users.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { MinhaContaModule } from './minha-conta/minha-conta.module';
import { CuponsModule } from './cupons/cupons.module';
import { FreteModule } from './frete/frete.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { EmailsModule } from './emails/emails.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    AuditModule,
    AuthModule,
    ProdutosModule,
    CategoriasModule,
    UsersModule,
    ConfiguracoesModule,
    PedidosModule,
    MinhaContaModule,
    CuponsModule,
    FreteModule,
    PagamentosModule,
    EmailsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
