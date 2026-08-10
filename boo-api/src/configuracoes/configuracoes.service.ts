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
  }) {
    const config = await this.obter();

    return this.prisma.configuracao.update({
      where: { id: config.id },
      data: dados,
    });
  }
}