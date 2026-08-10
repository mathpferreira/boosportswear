import { Module } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import {
  ConfiguracoesController,
  ConfiguracoesAdminController,
} from './configuracoes.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ConfiguracoesController, ConfiguracoesAdminController],
  providers: [ConfiguracoesService, PrismaService],
})
export class ConfiguracoesModule {}