import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CriarPedidoDto, StatusPedidoDto } from './pedidos.dto';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../common/types/request';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  private origemPublica(req: AuthenticatedRequest) {
    const protocolo = String(
      req.get?.('x-forwarded-proto') || req.protocol || 'http',
    )
      .split(',')[0]
      .trim();
    const host = String(
      req.get?.('x-forwarded-host') || req.get?.('host') || '',
    )
      .split(',')[0]
      .trim();
    return `${protocolo}://${host}`;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 10 * 60 * 1000 } })
  criar(
    @Body()
    body: CriarPedidoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pedidosService.criar(
      body,
      req.user.id,
      this.origemPublica(req),
    );
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
  atualizarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: StatusPedidoDto,
  ) {
    return this.pedidosService.atualizarStatus(id, body.status);
  }
}

@Controller('meus-pedidos')
@UseGuards(JwtAuthGuard)
export class MeusPedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  meusPedidos(@Req() req: AuthenticatedRequest) {
    return this.pedidosService.listarPorUsuario(req.user.id);
  }

  @Patch(':id/cancelar')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pedidosService.cancelar(id, 'cliente', req.user.id);
  }
}
