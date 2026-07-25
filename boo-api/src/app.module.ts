import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProdutosModule } from './produtos/produtos.module'; // Importou o Módulo
import { AuthModule } from './auth/auth.module';
import { CategoriasModule } from './categorias/categorias.module';

@Module({
  // Coloque o ProdutosModule dentro do array 'imports'
  imports: [AuthModule, ProdutosModule, CategoriasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}