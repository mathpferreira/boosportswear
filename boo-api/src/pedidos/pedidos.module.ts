import { Module } from '@nestjs/common';
import { MeusPedidosController, PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CuponsModule } from '../cupons/cupons.module';
import { FreteModule } from '../frete/frete.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';

@Module({
  imports: [CuponsModule, FreteModule, PagamentosModule],
  controllers: [PedidosController, MeusPedidosController],
  providers: [PedidosService, PrismaService],
})
export class PedidosModule {}
