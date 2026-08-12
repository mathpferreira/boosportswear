import { Module } from '@nestjs/common';
import { MeusPedidosController, PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PedidosController, MeusPedidosController],
  providers: [PedidosService, PrismaService],
})
export class PedidosModule {}
