import { Body, Controller, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { FreteService } from './frete.service';

@Controller('frete')
export class FreteController {
  private readonly consultas = new Map<string, { quantidade: number; expiraEm: number }>();

  constructor(private readonly freteService: FreteService) {}

  private limitar(req: any) {
    const chave = String(req?.ip || 'desconhecido');
    const agora = Date.now();
    const atual = this.consultas.get(chave);
    if (!atual || atual.expiraEm <= agora) {
      this.consultas.set(chave, { quantidade: 1, expiraEm: agora + 60 * 1000 });
      return;
    }
    if (atual.quantidade >= 30) {
      throw new HttpException('Muitas consultas de frete. Aguarde um instante.', HttpStatus.TOO_MANY_REQUESTS);
    }
    atual.quantidade += 1;
  }

  @Post('cotar')
  cotar(@Body() dados: any, @Req() req: any) {
    this.limitar(req);
    return this.freteService.cotar(dados);
  }
}
