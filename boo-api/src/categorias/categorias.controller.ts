import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CategoriaDto } from './categorias.dto';

@Controller('categorias') // Junto com o /api do main.ts, vira /api/categorias
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  async listarTodas() {
    return await this.categoriasService.listarTodas();
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return await this.categoriasService.buscarPorId(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async criarCategoria(@Body() dados: CategoriaDto) {
    return await this.categoriasService.criarCategoria(dados);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async atualizarCategoria(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: CategoriaDto,
  ) {
    return await this.categoriasService.atualizarCategoria(id, dados);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removerCategoria(@Param('id', ParseUUIDPipe) id: string) {
    return await this.categoriasService.removerCategoria(id);
  }
}
