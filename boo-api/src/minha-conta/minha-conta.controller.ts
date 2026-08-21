import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { MinhaContaService } from './minha-conta.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AtualizarContaDto } from './minha-conta.dto';
import type { AuthenticatedRequest } from '../common/types/request';

@Controller('minha-conta')
@UseGuards(JwtAuthGuard)
export class MinhaContaController {
  constructor(private readonly minhaContaService: MinhaContaService) {}

  @Get()
  obter(@Req() req: AuthenticatedRequest) {
    return this.minhaContaService.obter(req.user.id);
  }

  @Patch()
  atualizar(@Req() req: AuthenticatedRequest, @Body() body: AtualizarContaDto) {
    return this.minhaContaService.atualizar(req.user.id, body);
  }
}
