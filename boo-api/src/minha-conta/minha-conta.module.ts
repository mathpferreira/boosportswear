import { Module } from '@nestjs/common';
import { MinhaContaController } from './minha-conta.controller';
import { MinhaContaService } from './minha-conta.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MinhaContaController],
  providers: [MinhaContaService, PrismaService],
})
export class MinhaContaModule {}