import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { MinhaContaService } from './minha-conta.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('minha-conta')
@UseGuards(JwtAuthGuard)
export class MinhaContaController {
  constructor(private readonly minhaContaService: MinhaContaService) {}

  @Get()
  obter(@Req() req: any) {
    return this.minhaContaService.obter(req.user.id);
  }

  @Patch()
  atualizar(
    @Req() req: any,
    @Body()
    body: {
      nome?: string;
      email?: string;
      telefone?: string;
      enderecoPadrao?: {
        cep?: string;
        rua?: string;
        numero?: string;
        complemento?: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
      };
      preferenciasConta?: {
        novidadesEmail?: boolean;
        statusPedidoWhatsApp?: boolean;
        statusPedidoEmail?: boolean;
      };
    },
  ) {
    return this.minhaContaService.atualizar(req.user.id, body);
  }
}
