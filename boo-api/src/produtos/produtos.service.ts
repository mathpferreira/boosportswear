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
    return await prisma.produto.create({
      data: {
        nome: dados.nome,
        preco: Number(dados.preco) || 0,
        estoque: Number(dados.estoque) || 0,
        categoria: dados.categoria || "Geral",
        esgotado: dados.esgotado ?? false,
        ultimaPeca: dados.ultimaPeca ?? false,
        // Convertemos arrays/objetos complexos para JSON String para o banco aceitar sem choro
        imagens: dados.imagens ? JSON.stringify(dados.imagens) : "[]",
        cores: dados.cores ? JSON.stringify(dados.cores) : "[]",
        imgUrl: dados.imgUrl || (Array.isArray(dados.imagens) ? dados.imagens[0]?.url : "") || ""
      },
    });
  }
}