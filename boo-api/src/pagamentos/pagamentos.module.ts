import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InfinitePayService } from './infinitepay.service';
import { PagamentosController } from './pagamentos.controller';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [EmailsModule],
  controllers: [PagamentosController],
  providers: [InfinitePayService, PrismaService],
  exports: [InfinitePayService],
})
export class PagamentosModule {}
