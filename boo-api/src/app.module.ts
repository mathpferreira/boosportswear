import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProdutosModule } from './produtos/produtos.module'; // Importou o Módulo
import { AuthModule } from './auth/auth.module';

@Module({
  // Coloque o ProdutosModule dentro do array 'imports'
  imports: [AuthModule, ProdutosModule], 
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}