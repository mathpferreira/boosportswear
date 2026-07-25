import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CategoriasService } from './categorias.service';

@Controller('categorias') // Junto com o /api do main.ts, vira /api/categorias
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  async listarTodas() {
    return await this.categoriasService.listarTodas();
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return await this.categoriasService.buscarPorId(id);
  }

  @Post()
  async criarCategoria(@Body() dados: any) {
    return await this.categoriasService.criarCategoria(dados);
  }

  @Put(':id')
  async atualizarCategoria(@Param('id') id: string, @Body() dados: any) {
    return await this.categoriasService.atualizarCategoria(id, dados);
  }

  @Delete(':id')
  async removerCategoria(@Param('id') id: string) {
    return await this.categoriasService.removerCategoria(id);
  }
}