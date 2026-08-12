import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Rota pública — usada pela loja (tarja do topo, rodapé)
@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get()
  obter() {
    return this.configuracoesService.obter();
  }
}

// Rota protegida — usada pelo painel admin
@Controller('admin/configuracoes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ConfiguracoesAdminController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get()
  obter() {
    return this.configuracoesService.obter();
  }

  @Patch()
  atualizar(
    @Body()
    body: {
      lojaAberta?: boolean;
      fraseTopo?: string;
      instagramUrl?: string;
      emailSuporte?: string;
      frete?: any;
    },
  ) {
    return this.configuracoesService.atualizar(body);
  }
}
