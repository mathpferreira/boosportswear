import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async health() {
    const [estado] = await this.prisma.$queryRaw<
      Array<{ schemaReady: boolean }>
    >`
      SELECT (
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Produto' AND column_name = 'excluidoEm'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'tokenVersion'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Configuracao' AND column_name = 'emailTemplates'
        ) AND to_regclass('public."RefreshSession"') IS NOT NULL
        AND to_regclass('public."EmailToken"') IS NOT NULL
        AND to_regclass('public."AuditLog"') IS NOT NULL
        AND to_regclass('public."EmailOutbox"') IS NOT NULL
        AND to_regclass('public."PaymentWebhookEvent"') IS NOT NULL
      ) AS "schemaReady"
    `;

    if (!estado?.schemaReady) {
      throw new ServiceUnavailableException(
        'Banco de dados aguardando atualizacao de esquema.',
      );
    }

    return { status: 'ok' };
  }
}
