import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cupom } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CuponsService {
  constructor(private prisma: PrismaService) {}

  private normalizarCodigo(codigo: string) {
    return codigo.trim().toUpperCase();
  }

  private validarDisponibilidade(cupom: Cupom | null): asserts cupom is Cupom {
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
    const nome = String(dados.nome || '').trim();
    const valor = Number(dados.valor);
    if (nome.length < 2 || nome.length > 120)
      throw new BadRequestException('Nome de cupom invalido.');
    if (!codigo || codigo.length > 40)
      throw new BadRequestException('Codigo de cupom invalido.');
    if (!['PERCENTUAL', 'FIXO'].includes(dados.tipo))
      throw new BadRequestException('Tipo de cupom invalido.');
    if (
      !Number.isFinite(valor) ||
      valor <= 0 ||
      (dados.tipo === 'PERCENTUAL' && valor > 100)
    ) {
      throw new BadRequestException('Valor de cupom invalido.');
    }
    const existente = await this.prisma.cupom.findUnique({ where: { codigo } });
    if (existente) {
      throw new BadRequestException('Já existe um cupom com esse código.');
    }

    const expiraEm = dados.expiraEm ? new Date(dados.expiraEm) : null;
    if (expiraEm && Number.isNaN(expiraEm.getTime())) {
      throw new BadRequestException('Data de expiracao invalida.');
    }

    return this.prisma.cupom.create({
      data: {
        nome,
        codigo,
        tipo: dados.tipo,
        valor,
        expiraEm,
        usosMaximos:
          dados.usosMaximos == null
            ? null
            : Math.max(1, Math.floor(Number(dados.usosMaximos))),
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
    const nomeNormalizado =
      dados.nome === undefined ? undefined : String(dados.nome).trim();
    if (
      nomeNormalizado !== undefined &&
      (nomeNormalizado.length < 2 || nomeNormalizado.length > 120)
    ) {
      throw new BadRequestException('Nome de cupom invalido.');
    }
    if (dados.codigo) {
      codigoNormalizado = this.normalizarCodigo(dados.codigo);
      if (codigoNormalizado.length > 40)
        throw new BadRequestException('Codigo de cupom invalido.');
      const outro = await this.prisma.cupom.findUnique({
        where: { codigo: codigoNormalizado },
      });
      if (outro && outro.id !== id) {
        throw new BadRequestException('Já existe um cupom com esse código.');
      }
    }
    if (dados.tipo && !['PERCENTUAL', 'FIXO'].includes(dados.tipo)) {
      throw new BadRequestException('Tipo de cupom invalido.');
    }
    const tipoEfetivo = dados.tipo || cupom.tipo;
    const valorEfetivo = Number(dados.valor ?? cupom.valor);
    if (dados.valor !== undefined || dados.tipo !== undefined) {
      if (
        !Number.isFinite(valorEfetivo) ||
        valorEfetivo <= 0 ||
        (tipoEfetivo === 'PERCENTUAL' && valorEfetivo > 100)
      ) {
        throw new BadRequestException('Valor de cupom invalido.');
      }
    }
    const expiraEm = dados.expiraEm ? new Date(dados.expiraEm) : null;
    if (expiraEm && Number.isNaN(expiraEm.getTime())) {
      throw new BadRequestException('Data de expiracao invalida.');
    }

    return this.prisma.cupom.update({
      where: { id },
      data: {
        nome: nomeNormalizado,
        codigo: codigoNormalizado,
        tipo: dados.tipo,
        valor: dados.valor != null ? Number(dados.valor) : undefined,
        ativo: dados.ativo,
        expiraEm:
          dados.expiraEm === null
            ? null
            : dados.expiraEm
              ? expiraEm
              : undefined,
        usosMaximos:
          dados.usosMaximos === undefined
            ? undefined
            : dados.usosMaximos === null
              ? null
              : Math.max(1, Math.floor(Number(dados.usosMaximos))),
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
    const subtotalNumerico = Number(subtotal || 0);
    if (!Number.isFinite(subtotalNumerico) || subtotalNumerico < 0) {
      throw new BadRequestException('Subtotal invalido.');
    }
    const valorCupom = Number(cupom.valor);
    const desconto =
      cupom.tipo === 'PERCENTUAL'
        ? subtotalNumerico * (valorCupom / 100)
        : valorCupom;

    const descontoAplicado = Math.min(desconto, subtotalNumerico);

    return {
      id: cupom.id,
      nome: cupom.nome,
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor: valorCupom,
      descontoAplicado,
    };
  }
}
