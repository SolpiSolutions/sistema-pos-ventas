import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter);
  await app.register(multipart)
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(new ZodValidationPipe());

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`Corriendo en: http://localhost:${port}/api/v1`);
}
bootstrap();
