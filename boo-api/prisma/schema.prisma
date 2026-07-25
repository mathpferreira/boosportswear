import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return await this.prisma.produto.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new NotFoundException(`Produto com id "${id}" não encontrado`);
    }
    return produto;
  }

  async criarProduto(dados: any) {
    if (!dados) {
      throw new BadRequestException('Corpo da requisição vazio ou inválido');
    }
    if (!dados.nome) {
      throw new BadRequestException('O campo "nome" é obrigatório');
    }

    const imagens = Array.isArray(dados.imagens) ? dados.imagens : [];
    const cores = Array.isArray(dados.cores) ? dados.cores : [];

    return await this.prisma.produto.create({
      data: {
        nome: dados.nome,
        preco: Number(dados.preco) || 0,
        estoque: Number(dados.estoque) || 0,
        categoria: dados.categoria || "Geral",
        esgotado: dados.esgotado ?? false,
        ultimaPeca: dados.ultimaPeca ?? false,
        imagens: imagens,
        cores: cores,
        imgUrl: dados.imgUrl || (imagens.length > 0 ? imagens[0]?.url : "") || ""
      },
    });
  }

  async atualizarProduto(id: string, dados: any) {
    await this.buscarPorId(id); // garante que existe, senão já lança 404

    if (!dados) {
      throw new BadRequestException('Corpo da requisição vazio ou inválido');
    }

    const imagens = Array.isArray(dados.imagens) ? dados.imagens : [];
    const cores = Array.isArray(dados.cores) ? dados.cores : [];

    return await this.prisma.produto.update({
      where: { id },
      data: {
        nome: dados.nome,
        preco: Number(dados.preco) || 0,
        estoque: Number(dados.estoque) || 0,
        categoria: dados.categoria || "Geral",
        esgotado: dados.esgotado ?? false,
        ultimaPeca: dados.ultimaPeca ?? false,
        imagens: imagens,
        cores: cores,
        imgUrl: dados.imgUrl || (imagens.length > 0 ? imagens[0]?.url : "") || ""
      },
    });
  }

  async removerProduto(id: string) {
    await this.buscarPorId(id); // garante que existe, senão já lança 404
    return await this.prisma.produto.delete({ where: { id } });
  }
}