import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  // 1. DESLIGAMOS O LIMITADOR PADRÃO AQUI (bodyParser: false)
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  
  app.enableCors();
  app.setGlobalPrefix('api');

  // 2. ATIVAMOS A NOSSA REGRA DE 50MB AQUI
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(3000);
}
bootstrap();