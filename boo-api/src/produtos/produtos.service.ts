import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Produto } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { asRecord, safeString } from '../common/utils/value';
import { SalvarProdutoDto } from './produtos.dto';

type TamanhoProduto = { label: string; estoque: number };

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  private numeroPositivo(valor: unknown, padrao: number) {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero > 0 ? numero : padrao;
  }

  private normalizarTamanhos(tamanhos: unknown): TamanhoProduto[] {
    if (!Array.isArray(tamanhos)) return [];
    const vistos = new Set<string>();
    return tamanhos.reduce<TamanhoProduto[]>((lista, valor) => {
      const item = asRecord(valor);
      const original = safeString(item.label).trim();
      const label = original.toLowerCase().includes('nico')
        ? 'U'
        : original.toUpperCase();
      const estoque = Number(item.estoque || 0);
      if (!['P', 'M', 'G', 'U'].includes(label) || vistos.has(label))
        return lista;
      vistos.add(label);
      lista.push({
        label,
        estoque: Number.isInteger(estoque) && estoque >= 0 ? estoque : 0,
      });
      return lista;
    }, []);
  }

  private dadosProduto(dados: SalvarProdutoDto, atual?: Produto) {
    const nome = dados.nome.trim();
    const preco = Number(dados.preco);
    if (nome.length < 2 || nome.length > 160) {
      throw new BadRequestException('Nome de produto invalido.');
    }
    if (!Number.isFinite(preco) || preco < 0 || preco > 999999.99) {
      throw new BadRequestException('Preco de produto invalido.');
    }

    const imagens = Array.isArray(dados.imagens)
      ? dados.imagens
          .slice(0, 12)
          .map((imagem) => ({
            url: imagem.url.trim().slice(0, 500),
            cor: (imagem.cor || '#000000').trim().slice(0, 20),
          }))
          .filter((imagem) => imagem.url)
      : [];
    const cores = Array.isArray(dados.cores)
      ? dados.cores
          .slice(0, 12)
          .map((cor) => cor.trim().slice(0, 20))
          .filter(Boolean)
      : [];
    const tamanhos = this.normalizarTamanhos(dados.tamanhos);
    const estoqueTotal = tamanhos.reduce(
      (total, item) => total + item.estoque,
      0,
    );
    const estoqueSemGrade = Math.max(0, Math.floor(Number(dados.estoque) || 0));

    return {
      nome,
      descricao: (dados.descricao || '').trim().slice(0, 5000),
      sku: (dados.sku || '').trim().slice(0, 80) || null,
      preco,
      estoque: tamanhos.length ? estoqueTotal : estoqueSemGrade,
      tamanhos,
      categoria: (dados.categoria || 'Geral').trim().slice(0, 120),
      esgotado:
        dados.esgotado === undefined
          ? estoqueTotal === 0 && estoqueSemGrade === 0
          : Boolean(dados.esgotado),
      ultimaPeca: Boolean(dados.ultimaPeca),
      oculto:
        dados.oculto === undefined
          ? Boolean(atual?.oculto)
          : Boolean(dados.oculto),
      imagens,
      cores,
      imgUrl: (dados.imgUrl || imagens[0]?.url || '').trim().slice(0, 500),
      pesoKg: this.numeroPositivo(dados.pesoKg, Number(atual?.pesoKg || 0.5)),
      alturaCm: Math.round(
        this.numeroPositivo(dados.alturaCm, Number(atual?.alturaCm || 8)),
      ),
      larguraCm: Math.round(
        this.numeroPositivo(dados.larguraCm, Number(atual?.larguraCm || 20)),
      ),
      comprimentoCm: Math.round(
        this.numeroPositivo(
          dados.comprimentoCm,
          Number(atual?.comprimentoCm || 28),
        ),
      ),
    };
  }

  listarTodos() {
    return this.prisma.produto.findMany({
      where: { oculto: false, excluidoEm: null },
      orderBy: { criadoEm: 'desc' },
    });
  }

  listarTodosAdmin() {
    return this.prisma.produto.findMany({
      where: { excluidoEm: null },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    const produto = await this.prisma.produto.findFirst({
      where: { id, excluidoEm: null },
    });
    if (!produto) throw new NotFoundException('Produto nao encontrado.');
    return produto;
  }

  async buscarPublicoPorId(id: string) {
    const produto = await this.prisma.produto.findFirst({
      where: { id, oculto: false, excluidoEm: null },
    });
    if (!produto) throw new NotFoundException('Produto nao encontrado.');
    return produto;
  }

  criarProduto(dados: SalvarProdutoDto) {
    return this.prisma.produto.create({ data: this.dadosProduto(dados) });
  }

  async atualizarProduto(id: string, dados: SalvarProdutoDto) {
    const produtoAtual = await this.buscarPorId(id);
    return this.prisma.produto.update({
      where: { id },
      data: this.dadosProduto(dados, produtoAtual),
    });
  }

  async removerProduto(id: string) {
    await this.buscarPorId(id);
    return this.prisma.produto.update({
      where: { id },
      data: {
        oculto: true,
        esgotado: true,
        sku: null,
        excluidoEm: new Date(),
      },
    });
  }
}
