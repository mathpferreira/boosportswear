import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InfinitePayService } from './infinitepay.service';

@Controller('pagamentos/infinitepay')
export class PagamentosController {
  constructor(private readonly infinitePayService: InfinitePayService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() body: any) {
    return this.infinitePayService.confirmar(body);
  }

  @Post('confirmar')
  @UseGuards(JwtAuthGuard)
  confirmar(@Body() body: any, @Req() req: any) {
    return this.infinitePayService.confirmar(body, req.user.id);
  }
}
