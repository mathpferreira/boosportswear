import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CuponsService {
  constructor(private prisma: PrismaService) {}

  private normalizarCodigo(codigo: string) {
    return codigo.trim().toUpperCase();
  }

  private validarDisponibilidade(cupom: any) {
    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado.');
    }

    if (!cupom.ativo) {
      throw new BadRequestException('Este cupom está inativo.');
    }

    if (cupom.expiraEm && new Date(cupom.expiraEm) < new Date()) {
      throw new BadRequestException('Este cupom está expirado.');
    }

    if (cupom.usosMaximos && cupom.usosUtilizados >= cupom.usosMaximos) {
      throw new BadRequestException('Este cupom atingiu o limite de uso.');
    }
  }

  async listar() {
    return this.prisma.cupom.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  async criar(dados: {
    nome: string;
    codigo: string;
    tipo: 'PERCENTUAL' | 'FIXO';
    valor: number;
    expiraEm?: string;
    usosMaximos?: number | null;
  }) {
    const codigo = this.normalizarCodigo(dados.codigo);
    const existente = await this.prisma.cupom.findUnique({ where: { codigo } });
    if (existente) {
      throw new BadRequestException('Já existe um cupom com esse código.');
    }

    return this.prisma.cupom.create({
      data: {
        nome: dados.nome.trim(),
        codigo,
        tipo: dados.tipo,
        valor: Number(dados.valor),
        expiraEm: dados.expiraEm ? new Date(dados.expiraEm) : null,
        usosMaximos: dados.usosMaximos || null,
      },
    });
  }

  async atualizar(
    id: string,
    dados: {
      nome?: string;
      codigo?: string;
      tipo?: 'PERCENTUAL' | 'FIXO';
      valor?: number;
      ativo?: boolean;
      expiraEm?: string | null;
      usosMaximos?: number | null;
    },
  ) {
    const cupom = await this.prisma.cupom.findUnique({ where: { id } });
    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado.');
    }

    let codigoNormalizado: string | undefined;
    if (dados.codigo) {
      codigoNormalizado = this.normalizarCodigo(dados.codigo);
      const outro = await this.prisma.cupom.findUnique({ where: { codigo: codigoNormalizado } });
      if (outro && outro.id !== id) {
        throw new BadRequestException('Já existe um cupom com esse código.');
      }
    }

    return this.prisma.cupom.update({
      where: { id },
      data: {
        nome: dados.nome?.trim(),
        codigo: codigoNormalizado,
        tipo: dados.tipo,
        valor: dados.valor != null ? Number(dados.valor) : undefined,
        ativo: dados.ativo,
        expiraEm: dados.expiraEm === null ? null : (dados.expiraEm ? new Date(dados.expiraEm) : undefined),
        usosMaximos: dados.usosMaximos === undefined ? undefined : dados.usosMaximos,
      },
    });
  }

  async excluir(id: string) {
    const cupom = await this.prisma.cupom.findUnique({ where: { id } });
    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado.');
    }

    await this.prisma.cupom.delete({ where: { id } });
    return { ok: true };
  }

  async validar(codigo: string, subtotal: number) {
    const cupom = await this.prisma.cupom.findUnique({
      where: { codigo: this.normalizarCodigo(codigo) },
    });

    this.validarDisponibilidade(cupom);
    const cupomValido = cupom!;

    const subtotalNumerico = Number(subtotal || 0);
    const desconto = cupomValido.tipo === 'PERCENTUAL'
      ? subtotalNumerico * (cupomValido.valor / 100)
      : cupomValido.valor;

    const descontoAplicado = Math.min(desconto, subtotalNumerico);

    return {
      id: cupomValido.id,
      nome: cupomValido.nome,
      codigo: cupomValido.codigo,
      tipo: cupomValido.tipo,
      valor: cupomValido.valor,
      descontoAplicado,
    };
  }
}
