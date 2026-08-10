import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProdutosModule } from './produtos/produtos.module';
import { AuthModule } from './auth/auth.module';
import { CategoriasModule } from './categorias/categorias.module';
import { UsersModule } from './users/users.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';

@Module({
  imports: [AuthModule, ProdutosModule, CategoriasModule, UsersModule, ConfiguracoesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}