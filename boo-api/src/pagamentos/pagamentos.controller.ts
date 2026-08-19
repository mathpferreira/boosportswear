import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InfinitePayService } from './infinitepay.service';

@Controller('pagamentos/infinitepay')
export class PagamentosController {
  constructor(private readonly infinitePayService: InfinitePayService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: any) {
    try {
      const resultado = await this.infinitePayService.confirmar(body);
      if (!resultado.pago) throw new Error('Pagamento ainda nao confirmado.');
      return { success: true, message: null };
    } catch (erro: any) {
      throw new BadRequestException({
        success: false,
        message: erro?.message || 'Nao foi possivel confirmar o pagamento.',
      });
    }
  }

  @Post('confirmar')
  @UseGuards(JwtAuthGuard)
  confirmar(@Body() body: any, @Req() req: any) {
    return this.infinitePayService.confirmar(body, req.user.id);
  }
}
