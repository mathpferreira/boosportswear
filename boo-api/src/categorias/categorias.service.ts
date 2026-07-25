import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodas() {
    return await this.prisma.categoria.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) {
      throw new NotFoundException(`Categoria com id "${id}" não encontrada`);
    }
    return categoria;
  }

  async criarCategoria(dados: any) {
    if (!dados) {
      throw new BadRequestException('Corpo da requisição vazio ou inválido');
    }
    const nome = dados.nome?.trim();
    if (!nome) {
      throw new BadRequestException('O campo "nome" é obrigatório');
    }

    const existente = await this.prisma.categoria.findUnique({ where: { nome } });
    if (existente) {
      throw new ConflictException(`Categoria "${nome}" já existe`);
    }

    return await this.prisma.categoria.create({
      data: { nome },
    });
  }

  async atualizarCategoria(id: string, dados: any) {
    await this.buscarPorId(id); // garante que existe, senão já lança 404

    if (!dados) {
      throw new BadRequestException('Corpo da requisição vazio ou inválido');
    }
    const nome = dados.nome?.trim();
    if (!nome) {
      throw new BadRequestException('O campo "nome" é obrigatório');
    }

    return await this.prisma.categoria.update({
      where: { id },
      data: { nome },
    });
  }

  async removerCategoria(id: string) {
    await this.buscarPorId(id); // garante que existe, senão já lança 404
    return await this.prisma.categoria.delete({ where: { id } });
  }
}