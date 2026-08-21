import { Module } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import {
  ConfiguracoesController,
  ConfiguracoesAdminController,
} from './configuracoes.controller';

@Module({
  controllers: [ConfiguracoesController, ConfiguracoesAdminController],
  providers: [ConfiguracoesService],
})
export class ConfiguracoesModule {}
