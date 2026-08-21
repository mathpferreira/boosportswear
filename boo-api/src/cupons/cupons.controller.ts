import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CuponsService } from './cupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  AtualizarCupomDto,
  CriarCupomDto,
  ValidarCupomDto,
} from './cupons.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('cupons')
export class CuponsPublicController {
  constructor(private readonly cuponsService: CuponsService) {}

  @Get('validar')
  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  validar(@Query() query: ValidarCupomDto) {
    return this.cuponsService.validar(query.codigo, query.subtotal);
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
  criar(@Body() body: CriarCupomDto) {
    return this.cuponsService.criar(body);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AtualizarCupomDto,
  ) {
    return this.cuponsService.atualizar(id, body);
  }

  @Delete(':id')
  excluir(@Param('id', ParseUUIDPipe) id: string) {
    return this.cuponsService.excluir(id);
  }
}
