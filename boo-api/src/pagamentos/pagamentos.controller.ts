import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InfinitePayService } from './infinitepay.service';
import { ConfirmarPagamentoDto, WebhookInfinitePayDto } from './pagamentos.dto';
import type { AuthenticatedRequest } from '../common/types/request';

@Controller('pagamentos/infinitepay')
export class PagamentosController {
  constructor(private readonly infinitePayService: InfinitePayService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 120, ttl: 60 * 1000 } })
  webhook(@Body() body: WebhookInfinitePayDto) {
    return this.infinitePayService.receberWebhook(body);
  }

  @Post('confirmar')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  confirmar(
    @Body() body: ConfirmarPagamentoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.infinitePayService.confirmar(body, req.user.id);
  }
}
