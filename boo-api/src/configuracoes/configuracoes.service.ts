import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { safeString } from '../common/utils/value';

@Injectable()
export class ConfiguracoesService {
  constructor(private readonly prisma: PrismaService) {}

  async obter() {
    let config = await this.prisma.configuracao.findFirst();
    if (!config) config = await this.prisma.configuracao.create({ data: {} });
    return config;
  }

  async obterPublico() {
    const config = await this.obter();
    const frete =
      config.frete &&
      typeof config.frete === 'object' &&
      !Array.isArray(config.frete)
        ? (config.frete as Record<string, unknown>)
        : {};
    return {
      id: config.id,
      lojaAberta: config.lojaAberta,
      fraseTopo: config.fraseTopo,
      instagramUrl: config.instagramUrl,
      emailSuporte: config.emailSuporte,
      termsVersion: process.env.TERMS_VERSION || '2026-08-20',
      frete: {
        ativo: frete.ativo !== false,
        motoboyAtivo: frete.motoboyAtivo !== false,
      },
      atualizadoEm: config.atualizadoEm,
    };
  }

  private instagram(valor: unknown) {
    const texto = safeString(valor).trim().slice(0, 300);
    if (!texto) return '';
    const normalizado = texto.startsWith('@')
      ? 'https://instagram.com/' + texto.slice(1)
      : texto.startsWith('http')
        ? texto
        : 'https://instagram.com/' + texto.replace(/^\/+/, '');
    try {
      const url = new URL(normalizado);
      if (
        url.protocol !== 'https:' ||
        !['instagram.com', 'www.instagram.com'].includes(
          url.hostname.toLowerCase(),
        )
      ) {
        throw new Error();
      }
      return url.toString();
    } catch {
      throw new BadRequestException('Informe um perfil valido do Instagram.');
    }
  }

  private normalizarFrete(valor: unknown) {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
      throw new BadRequestException('Configuracao de frete invalida.');
    }
    const dados = valor as Record<string, unknown>;
    const cepOrigem = safeString(
      dados.cepOrigem,
      process.env.FRENET_CEP_ORIGEM || '',
    ).replace(/\D/g, '');
    if (cepOrigem.length !== 8)
      throw new BadRequestException('CEP de origem invalido.');
    const positivo = (nome: string, padrao: number) => {
      const numero = Number(dados[nome]);
      return Number.isFinite(numero) && numero > 0 ? numero : padrao;
    };
    return {
      ativo: dados.ativo !== false,
      motoboyAtivo: dados.motoboyAtivo !== false,
      cepOrigem,
      larguraCm: positivo('larguraCm', 20),
      alturaCm: positivo('alturaCm', 8),
      comprimentoCm: positivo('comprimentoCm', 28),
      pesoKg: positivo('pesoKg', 0.5),
    };
  }

  async atualizar(dados: {
    lojaAberta?: boolean;
    fraseTopo?: string;
    instagramUrl?: string;
    emailSuporte?: string;
    frete?: unknown;
  }) {
    const config = await this.obter();
    const email =
      dados.emailSuporte === undefined
        ? undefined
        : String(dados.emailSuporte).trim().toLowerCase().slice(0, 160);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('E-mail de suporte invalido.');
    }
    const payload = {
      ...(dados.lojaAberta !== undefined
        ? { lojaAberta: Boolean(dados.lojaAberta) }
        : {}),
      ...(dados.fraseTopo !== undefined
        ? { fraseTopo: String(dados.fraseTopo).trim().slice(0, 180) }
        : {}),
      ...(dados.instagramUrl !== undefined
        ? { instagramUrl: this.instagram(dados.instagramUrl) }
        : {}),
      ...(email !== undefined ? { emailSuporte: email } : {}),
      ...(dados.frete !== undefined
        ? {
            frete: this.normalizarFrete(dados.frete) as Prisma.InputJsonValue,
          }
        : {}),
    };
    return this.prisma.configuracao.update({
      where: { id: config.id },
      data: payload,
    });
  }
}
