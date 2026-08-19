import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  private origemPublica(req: any) {
    const protocolo = String(req.get?.('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
    const host = String(req.get?.('x-forwarded-host') || req.get?.('host') || '').split(',')[0].trim();
    return `${protocolo}://${host}`;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  criar(
    @Body()
    body: {
      usuarioId?: string | null;
      itens: any[];
      entrega: any;
      formaPagamento: string;
      frete?: any;
      total: number;
      cupom?: any;
    },
    @Req() req: any,
  ) {
    return this.pedidosService.criar(body, req.user.id, this.origemPublica(req));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  listarTodos() {
    return this.pedidosService.listarTodos();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  atualizarStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.pedidosService.atualizarStatus(id, body.status);
  }
}

@Controller('meus-pedidos')
@UseGuards(JwtAuthGuard)
export class MeusPedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  meusPedidos(@Req() req: any) {
    return this.pedidosService.listarPorUsuario(req.user.id);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string, @Req() req: any) {
    return this.pedidosService.cancelar(id, 'cliente', req.user.id);
  }
}
