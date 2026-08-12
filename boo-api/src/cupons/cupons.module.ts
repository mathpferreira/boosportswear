import { Module } from '@nestjs/common';
import { CuponsService } from './cupons.service';
import { CuponsAdminController, CuponsPublicController } from './cupons.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CuponsPublicController, CuponsAdminController],
  providers: [CuponsService, PrismaService],
})
export class CuponsModule {}
