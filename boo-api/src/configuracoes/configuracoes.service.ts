import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConfiguracoesService {
  constructor(private prisma: PrismaService) {}

  // Garante que sempre existe exatamente 1 registro de configuração
  async obter() {
    let config = await this.prisma.configuracao.findFirst();

    if (!config) {
      config = await this.prisma.configuracao.create({ data: {} });
    }

    return config;
  }

  async atualizar(dados: {
    lojaAberta?: boolean;
    fraseTopo?: string;
    instagramUrl?: string;
    emailSuporte?: string;
    frete?: any;
  }) {
    const config = await this.obter();

    const payload = {
      ...(dados.lojaAberta !== undefined ? { lojaAberta: Boolean(dados.lojaAberta) } : {}),
      ...(dados.fraseTopo !== undefined ? { fraseTopo: String(dados.fraseTopo).trim().slice(0, 180) } : {}),
      ...(dados.instagramUrl !== undefined ? { instagramUrl: String(dados.instagramUrl).trim().slice(0, 300) } : {}),
      ...(dados.emailSuporte !== undefined ? { emailSuporte: String(dados.emailSuporte).trim().slice(0, 160) } : {}),
      ...(dados.frete !== undefined ? { frete: dados.frete } : {}),
    };

    return this.prisma.configuracao.update({
      where: { id: config.id },
      data: payload,
    });
  }
}
