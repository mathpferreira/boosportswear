import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';
// Sobe duas vezes para sair de 'produtos' e de 'src', alcançando a pasta 'prisma' na raiz:
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // necessário para o JwtAuthGuard/RolesGuard funcionarem aqui
  controllers: [ProdutosController],
  providers: [ProdutosService, PrismaService],
})
export class ProdutosModule {}