import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';
// Sobe duas vezes para sair de 'produtos' e de 'src', alcançando a pasta 'prisma' na raiz:
import { PrismaService } from '../../prisma/prisma.service'; 

@Module({
  controllers: [ProdutosController],
  providers: [ProdutosService, PrismaService],
})
export class ProdutosModule {}