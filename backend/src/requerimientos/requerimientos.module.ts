import { Module } from '@nestjs/common';
import { RequerimientosController } from './requerimientos.controller';
import { RequerimientosService } from './requerimientos.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [NotificacionesModule],
  controllers: [RequerimientosController],
  providers: [RequerimientosService],
  exports: [RequerimientosService],
})
export class RequerimientosModule {}
