import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('meus-pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  meusPedidos(@Req() req: any) {
    return this.pedidosService.listarPorUsuario(req.user.id);
  }
}