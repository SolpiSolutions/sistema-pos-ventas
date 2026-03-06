import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './db/db.module';
import { InventarioModule } from './inventario/inventario.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { VentasModule } from './ventas/ventas.module';
import { ReportesModule } from './reportes/reportes.module';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CloudinaryModule,
    AuthModule,
    DatabaseModule,
    InventarioModule,
    CatalogoModule,
    VentasModule,
    ReportesModule,
    UserModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
