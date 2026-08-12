import { Module } from '@nestjs/common';
import { FreteController } from './frete.controller';
import { FreteService } from './frete.service';

@Module({
  controllers: [FreteController],
  providers: [FreteService],
})
export class FreteModule {}
