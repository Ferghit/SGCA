import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private service: NotificacionesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findByUsuario(req.user.id);
  }

  @Get('historial')
  getHistorial(@Request() req: any) {
    return this.service.findByUsuarioHistorial(req.user.id);
  }

  @Get('no-leidas/count')
  countNoLeidas(@Request() req: any) {
    return this.service.contarNoLeidas(req.user.id);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.marcarLeida(id, req.user.id);
  }

  @Patch('leer-todas')
  marcarTodasLeidas(@Request() req: any) {
    return this.service.marcarTodasLeidas(req.user.id);
  }
}
