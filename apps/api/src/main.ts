import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter);
  await app.register(multipart)
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(new ZodValidationPipe());

  // Configurar Swagger con Scalar
  const config = new DocumentBuilder()
    .setTitle('Restaurante API')
    .setDescription('API del sistema de gestión de restaurante')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .addTag('Auth', 'Autenticación')
    .addTag('Catálogo', 'Gestión del catálogo de productos')
    .addTag('Inventario', 'Gestión de inventario e insumos')
    .addTag('Ventas', 'Gestión de ventas y sesiones de caja')
    .addTag('Reportes', 'Generación de reportes')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Servir documentación Swagger
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`Corriendo en: http://localhost:${port}/api/v1`);
  console.log(`Documentación en: http://localhost:${port}/api/v1/docs`);
}
bootstrap();
