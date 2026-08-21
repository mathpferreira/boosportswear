import { Module } from '@nestjs/common';
import { CuponsService } from './cupons.service';
import {
  CuponsAdminController,
  CuponsPublicController,
} from './cupons.controller';

@Module({
  controllers: [CuponsPublicController, CuponsAdminController],
  providers: [CuponsService],
  exports: [CuponsService],
})
export class CuponsModule {}
