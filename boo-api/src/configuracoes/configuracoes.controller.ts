import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AtualizarConfiguracaoDto } from './configuracoes.dto';

// Rota pública — usada pela loja (tarja do topo, rodapé)
@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get()
  obter() {
    return this.configuracoesService.obterPublico();
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
  atualizar(@Body() body: AtualizarConfiguracaoDto) {
    return this.configuracoesService.atualizar(body);
  }
}
