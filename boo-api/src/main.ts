import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Limites gigantes para a foto
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  app.enableCors();

  // A LINHA MÁGICA QUE RESOLVE O 404:
  app.setGlobalPrefix('api');

  await app.listen(3000);
}
bootstrap();