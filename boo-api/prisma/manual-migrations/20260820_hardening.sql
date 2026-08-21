BEGIN;

-- Preserve existing values while switching monetary columns away from floating point.
ALTER TABLE "Produto" ALTER COLUMN "preco" TYPE DECIMAL(12,2)
  USING ROUND("preco"::numeric, 2);
ALTER TABLE "Pedido" ALTER COLUMN "total" TYPE DECIMAL(12,2)
  USING ROUND("total"::numeric, 2);
ALTER TABLE "Cupom" ALTER COLUMN "valor" TYPE DECIMAL(12,2)
  USING ROUND("valor"::numeric, 2);

ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "descricao" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "pesoKg" DECIMAL(8,3) NOT NULL DEFAULT 0.5;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "alturaCm" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "larguraCm" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "comprimentoCm" INTEGER NOT NULL DEFAULT 28;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "excluidoEm" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingConsentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Existing legitimate accounts remain usable. Do not fabricate historical consent.
UPDATE "User"
SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt")
WHERE "emailVerifiedAt" IS NULL;

ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "emailTemplates" JSONB;

-- Remove only broken references before enforcing the relationship.
UPDATE "Pedido" AS pedido
SET "usuarioId" = NULL
WHERE "usuarioId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" AS usuario WHERE usuario."id" = pedido."usuarioId");

-- Normalize legacy labels without touching stock quantities.
UPDATE "Produto"
SET "tamanhos" = COALESCE((
  SELECT jsonb_agg(
    CASE
      WHEN LOWER(COALESCE(item->>'label', '')) LIKE '%nico%'
        THEN jsonb_set(item, '{label}', '"U"'::jsonb)
      ELSE item
    END
  )
  FROM jsonb_array_elements("Produto"."tamanhos") AS item
), '[]'::jsonb)
WHERE jsonb_typeof("tamanhos") = 'array';

DO $$ BEGIN
  CREATE TYPE "EmailTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentWebhookStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "RefreshSession" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userAgent" TEXT,
  "ip" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmailToken" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" "EmailTokenType" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT,
  "actorNome" TEXT NOT NULL,
  "acao" TEXT NOT NULL,
  "entidade" TEXT NOT NULL,
  "entidadeId" TEXT,
  "detalhes" JSONB,
  "ip" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmailOutbox" (
  "id" TEXT PRIMARY KEY,
  "destinatario" TEXT NOT NULL,
  "assunto" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "evento" TEXT NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "proximaTentativa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "providerId" TEXT,
  "ultimoErro" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "enviadoEm" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "transactionNsu" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "PaymentWebhookStatus" NOT NULL DEFAULT 'PENDING',
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "proximaTentativa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ultimoErro" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processadoEm" TIMESTAMP(3)
);

DO $$ BEGIN
  ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Produto_sku_key" ON "Produto"("sku");
DROP INDEX IF EXISTS "Produto_oculto_criadoEm_idx";
CREATE INDEX IF NOT EXISTS "Produto_excluidoEm_oculto_criadoEm_idx" ON "Produto"("excluidoEm", "oculto", "criadoEm");
CREATE INDEX IF NOT EXISTS "Produto_categoria_oculto_idx" ON "Produto"("categoria", "oculto");
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx" ON "User"("role", "createdAt");
CREATE INDEX IF NOT EXISTS "Pedido_usuarioId_criadoEm_idx" ON "Pedido"("usuarioId", "criadoEm");
CREATE INDEX IF NOT EXISTS "Pedido_status_expiraEmPagamento_idx" ON "Pedido"("status", "expiraEmPagamento");
CREATE INDEX IF NOT EXISTS "Pedido_criadoEm_idx" ON "Pedido"("criadoEm");
CREATE INDEX IF NOT EXISTS "Cupom_ativo_expiraEm_idx" ON "Cupom"("ativo", "expiraEm");
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshSession_userId_expiresAt_idx" ON "RefreshSession"("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "RefreshSession_expiresAt_revokedAt_idx" ON "RefreshSession"("expiresAt", "revokedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailToken_tokenHash_key" ON "EmailToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "EmailToken_userId_type_expiresAt_idx" ON "EmailToken"("userId", "type", "expiresAt");
CREATE INDEX IF NOT EXISTS "AuditLog_criadoEm_idx" ON "AuditLog"("criadoEm");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_criadoEm_idx" ON "AuditLog"("actorId", "criadoEm");
CREATE INDEX IF NOT EXISTS "AuditLog_entidade_entidadeId_idx" ON "AuditLog"("entidade", "entidadeId");
CREATE INDEX IF NOT EXISTS "EmailOutbox_status_proximaTentativa_idx" ON "EmailOutbox"("status", "proximaTentativa");
CREATE INDEX IF NOT EXISTS "EmailOutbox_criadoEm_idx" ON "EmailOutbox"("criadoEm");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentWebhookEvent_transactionNsu_key" ON "PaymentWebhookEvent"("transactionNsu");
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_status_proximaTentativa_idx" ON "PaymentWebhookEvent"("status", "proximaTentativa");
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_criadoEm_idx" ON "PaymentWebhookEvent"("criadoEm");

DO $$ BEGIN
  ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_status_check" CHECK (
    "status" IN ('aguardando_pagamento', 'pendente', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado', 'pagamento_apos_cancelamento')
  ) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Produto" ADD CONSTRAINT "Produto_valores_check" CHECK (
    "preco" >= 0 AND "estoque" >= 0 AND "pesoKg" > 0 AND
    "alturaCm" > 0 AND "larguraCm" > 0 AND "comprimentoCm" > 0
  ) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_total_check" CHECK ("total" >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Cupom" ADD CONSTRAINT "Cupom_valores_check" CHECK (
    "valor" > 0 AND "usosUtilizados" >= 0 AND
    ("usosMaximos" IS NULL OR "usosMaximos" > 0)
  ) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Keep the migration role separate from the future runtime-only boo_app role.
ALTER TABLE "RefreshSession" OWNER TO boo_user;
ALTER TABLE "EmailToken" OWNER TO boo_user;
ALTER TABLE "AuditLog" OWNER TO boo_user;
ALTER TABLE "EmailOutbox" OWNER TO boo_user;
ALTER TABLE "PaymentWebhookEvent" OWNER TO boo_user;
ALTER TYPE "EmailTokenType" OWNER TO boo_user;
ALTER TYPE "EmailDeliveryStatus" OWNER TO boo_user;
ALTER TYPE "PaymentWebhookStatus" OWNER TO boo_user;

COMMIT;
