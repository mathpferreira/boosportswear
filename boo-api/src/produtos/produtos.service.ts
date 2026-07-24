import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ProdutosService {
  async listarTodos() {
    return await prisma.produto.findMany({
      orderBy: { criadoEm: 'desc' }
    });
  }

  async criarProduto(dados: any) {
    // Garantimos que imagens e cores sejam passados no formato correto que o Prisma aceita
    let imagensTratadas = dados.imagens;
    if (typeof imagensTratadas === 'string') {
      try { imagensTratadas = JSON.parse(imagensTratadas); } catch { imagensTratadas = []; }
    }

    let coresTratadas = dados.cores;
    if (typeof coresTratadas === 'string') {
      try { coresTratadas = JSON.parse(coresTratadas); } catch { coresTratadas = []; }
    }

    return await prisma.produto.create({
      data: {
        nome: dados.nome,
        preco: Number(dados.preco) || 0,
        estoque: Number(dados.estoque) || 0,
        categoria: dados.categoria || "Geral",
        esgotado: dados.esgotado ?? false,
        ultimaPeca: dados.ultimaPeca ?? false,
        imagens: imagensTratadas ?? [],
        cores: coresTratadas ?? [],
        imgUrl: dados.imgUrl || (Array.isArray(imagensTratadas) && imagensTratadas.length > 0 ? imagensTratadas[0]?.url : "") || ""
      },
    });
  }
}