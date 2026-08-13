import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizarTamanhos(tamanhos: any) {
    if (!Array.isArray(tamanhos)) return [];

    const vistos = new Set<string>();
    return tamanhos.reduce((lista, item) => {
      const label = String(item?.label || '').trim();
      const estoque = Number(item?.estoque || 0);
      const chave = label.toLowerCase();
      if (!label || vistos.has(chave)) return lista;
      vistos.add(chave);
      lista.push({
        label,
        estoque: Number.isInteger(estoque) && estoque >= 0 ? estoque : 0,
      });
      return lista;
    }, [] as Array<{ label: string; estoque: number }>);
  }

  async listarTodos() {
    return await this.prisma.produto.findMany({
      where: { oculto: false },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async listarTodosAdmin() {
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

  async buscarPublicoPorId(id: string) {
    const produto = await this.prisma.produto.findFirst({ where: { id, oculto: false } });
    if (!produto) {
      throw new NotFoundException(`Produto com id "${id}" nao encontrado`);
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

    const nome = String(dados.nome).trim();
    const preco = Number(dados.preco);
    if (nome.length < 2 || nome.length > 160) throw new BadRequestException('Nome de produto inválido.');
    if (!Number.isFinite(preco) || preco < 0) throw new BadRequestException('Preço de produto inválido.');

    const imagens = Array.isArray(dados.imagens) ? dados.imagens : [];
    const cores = Array.isArray(dados.cores) ? dados.cores : [];
    const tamanhos = this.normalizarTamanhos(dados.tamanhos);
    const estoqueTotal = tamanhos.reduce((acc, item) => acc + item.estoque, 0);

    return await this.prisma.produto.create({
      data: {
        nome,
        preco,
        estoque: tamanhos.length > 0 ? estoqueTotal : Math.max(0, Math.floor(Number(dados.estoque) || 0)),
        tamanhos,
        categoria: dados.categoria || "Geral",
        esgotado: dados.esgotado ?? false,
        ultimaPeca: dados.ultimaPeca ?? false,
        oculto: dados.oculto ?? false,
        imagens: imagens,
        cores: cores,
        imgUrl: dados.imgUrl || (imagens.length > 0 ? imagens[0]?.url : "") || ""
      },
    });
  }

  async atualizarProduto(id: string, dados: any) {
    await this.buscarPorId(id); // garante que existe, senão já lança 404

    const produtoAtual = await this.prisma.produto.findUnique({ where: { id } });
    if (!produtoAtual) throw new NotFoundException('Produto nao encontrado.');

    if (!dados) {
      throw new BadRequestException('Corpo da requisição vazio ou inválido');
    }

    const nome = String(dados.nome || '').trim();
    const preco = Number(dados.preco);
    if (nome.length < 2 || nome.length > 160) throw new BadRequestException('Nome de produto inválido.');
    if (!Number.isFinite(preco) || preco < 0) throw new BadRequestException('Preço de produto inválido.');

    const imagens = Array.isArray(dados.imagens) ? dados.imagens : [];
    const cores = Array.isArray(dados.cores) ? dados.cores : [];
    const tamanhos = this.normalizarTamanhos(dados.tamanhos);
    const estoqueTotal = tamanhos.reduce((acc, item) => acc + item.estoque, 0);

    return await this.prisma.produto.update({
      where: { id },
      data: {
        nome,
        preco,
        estoque: tamanhos.length > 0 ? estoqueTotal : Math.max(0, Math.floor(Number(dados.estoque) || 0)),
        tamanhos,
        categoria: dados.categoria || "Geral",
        esgotado: dados.esgotado ?? false,
        ultimaPeca: dados.ultimaPeca ?? false,
        oculto: dados.oculto === undefined ? produtoAtual.oculto : Boolean(dados.oculto),
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
