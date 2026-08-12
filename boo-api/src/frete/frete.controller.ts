import { Body, Controller, Post } from '@nestjs/common';
import { FreteService } from './frete.service';

@Controller('frete')
export class FreteController {
  constructor(private readonly freteService: FreteService) {}

  @Post('cotar')
  cotar(@Body() dados: any) {
    return this.freteService.cotar(dados);
  }
}
