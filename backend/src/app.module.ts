import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RequerimientosModule } from './requerimientos/requerimientos.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { AlmacenModule } from './almacen/almacen.module';
import { ProductosModule } from './productos/productos.module';
import { OrdenesCompraModule } from './ordenes-compra/ordenes-compra.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RequerimientosModule,
    NotificacionesModule,
    CotizacionesModule,
    AlmacenModule,
    ProductosModule,
    OrdenesCompraModule,
  ],
})
export class AppModule {}
