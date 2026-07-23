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

  async criarProduto(dados: {
    nome: string;
    preco: number;
    esgotado?: boolean;
    ultimaPeca?: boolean;
    imagens?: string[];
  }) {
    return await prisma.produto.create({
      data: {
        nome: dados.nome,
        preco: dados.preco,
        esgotado: dados.esgotado ?? false,
        ultimaPeca: dados.ultimaPeca ?? false,
        imagens: dados.imagens ?? [],
      },
    });
  }
}