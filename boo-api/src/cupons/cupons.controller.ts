import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CuponsService } from './cupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cupons')
export class CuponsPublicController {
  constructor(private readonly cuponsService: CuponsService) {}

  @Get('validar')
  validar(@Query('codigo') codigo: string, @Query('subtotal') subtotal: string) {
    return this.cuponsService.validar(codigo, Number(subtotal || 0));
  }
}

@Controller('admin/cupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CuponsAdminController {
  constructor(private readonly cuponsService: CuponsService) {}

  @Get()
  listar() {
    return this.cuponsService.listar();
  }

  @Post()
  criar(
    @Body()
    body: {
      nome: string;
      codigo: string;
      tipo: 'PERCENTUAL' | 'FIXO';
      valor: number;
      expiraEm?: string;
      usosMaximos?: number | null;
    },
  ) {
    return this.cuponsService.criar(body);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body()
    body: {
      nome?: string;
      codigo?: string;
      tipo?: 'PERCENTUAL' | 'FIXO';
      valor?: number;
      ativo?: boolean;
      expiraEm?: string | null;
      usosMaximos?: number | null;
    },
  ) {
    return this.cuponsService.atualizar(id, body);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.cuponsService.excluir(id);
  }
}
