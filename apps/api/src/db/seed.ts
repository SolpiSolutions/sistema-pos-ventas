import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../users/user.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userService = app.get(UserService);
  const configService = app.get(ConfigService);

  const masterEmail = configService.get<string>('MASTER_EMAIL');
  const masterPassword = configService.get<string>('MASTER_PASSWORD');
  
  if (!masterEmail) {
    console.error('Error: MASTER_EMAIL no definido en las variables de entorno.');
    await app.close();
    process.exit(1);
  }

  try {
    console.log(`🌱 Sembrando Administrador Maestro: ${masterEmail}...`);
    
    await userService.create({
      nombre: 'Administrador Maestro',
      email: masterEmail,
      password: masterPassword,
      rol: 'ADMINISTRADOR',
    });

    console.log('✅ Usuario maestro creado con éxito.');
  } catch (error: any) {
    if (error.status === 409) {
      console.log('ℹ️ El administrador maestro ya existe en la base de datos.');
    } else {
      console.error('❌ Error inesperado:', error.message);
    }
  } finally {
    await app.close();
  }
}

bootstrap();