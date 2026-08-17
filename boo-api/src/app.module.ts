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

@Module({
  imports: [AuthModule, ProdutosModule, CategoriasModule, UsersModule, ConfiguracoesModule, PedidosModule, MinhaContaModule, CuponsModule, FreteModule, PagamentosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
