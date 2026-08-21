import './config/load-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import express from 'express';
import type { Express, NextFunction, Response } from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { AppModule } from './app.module';
import { DecimalInterceptor } from './common/interceptors/decimal.interceptor';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { validarAmbiente } from './config/env';
import type { CookieRequest } from './common/types/request';

async function bootstrap() {
  validarAmbiente();
  const uploadsRoot = join(process.cwd(), 'uploads');
  await mkdir(join(uploadsRoot, 'produtos'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const expressApp: Express = app.getHttpAdapter().getInstance();

  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', 1);
  app.enableShutdownHooks();
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb', strict: true }));
  app.use(express.urlencoded({ limit: '100kb', extended: false }));

  const allowedOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
    maxAge: 86400,
  });

  app.use((req: CookieRequest, res: Response, next: NextFunction) => {
    const mutacao = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const usaSessao = Boolean(
      req.cookies?.['__Host-boo_access'] ||
      req.cookies?.['__Host-boo_refresh'] ||
      req.cookies?.boo_access ||
      req.cookies?.boo_refresh,
    );
    if (usaSessao) res.setHeader('Cache-Control', 'no-store');
    const origin = String(req.get('origin') || '');
    if (mutacao && usaSessao && origin && !allowedOrigins.includes(origin)) {
      return res
        .status(403)
        .json({ message: 'Origem da requisicao nao autorizada.' });
    }
    return next();
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalInterceptors(new DecimalInterceptor());
  app.useGlobalFilters(new PrismaExceptionFilter());

  app.useStaticAssets(uploadsRoot, {
    prefix: '/uploads/',
    setHeaders: (res: Response) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, process.env.API_HOST || '127.0.0.1');
}

void bootstrap();
