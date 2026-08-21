import { Module } from '@nestjs/common';
import { MeusPedidosController, PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { CuponsModule } from '../cupons/cupons.module';
import { FreteModule } from '../frete/frete.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [CuponsModule, FreteModule, PagamentosModule, EmailsModule],
  controllers: [PedidosController, MeusPedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
