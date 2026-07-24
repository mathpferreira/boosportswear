import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express'; // <-- Importe isso

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aumente o limite para 50MB
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  app.enableCors();
  await app.listen(3000);
}
bootstrap();