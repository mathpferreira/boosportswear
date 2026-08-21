import { Module } from '@nestjs/common';
import { MinhaContaController } from './minha-conta.controller';
import { MinhaContaService } from './minha-conta.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MinhaContaController],
  providers: [MinhaContaService],
})
export class MinhaContaModule {}
