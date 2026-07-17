import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CotizacionesService } from './cotizaciones.service';
import { CreateSolicitudCotizacionDto } from './dto/create-solicitud.dto';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { SeleccionarGanadorDto } from './dto/seleccionar-ganador.dto';
import { NuevaRondaCotizacionDto } from './dto/nueva-ronda.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private service: CotizacionesService) {}

  // ── Analista: publicar solicitud de cotización ───────────────────────────────

  @Roles(Rol.ANALISTA_COMPRAS, Rol.ADMIN)
  @Post('solicitudes')
  crearSolicitud(@Body() dto: CreateSolicitudCotizacionDto, @Request() req: any) {
    return this.service.crearSolicitud(dto, req.user.id);
  }

  @Get('solicitudes')
  findAllSolicitudes(@Request() req: any) {
    return this.service.findAllSolicitudes(req.user.rol, req.user.id);
  }

  @Get('solicitudes/:id')
  findOneSolicitud(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneSolicitud(id);
  }

  @Roles(Rol.ANALISTA_COMPRAS, Rol.ADMIN)
  @Get('requerimientos-aprobados')
  getRequerimientosAprobados() {
    return this.service.getRequerimientosAprobados();
  }

  @Roles(Rol.ANALISTA_COMPRAS, Rol.ADMIN)
  @Get('solicitudes/:id/reporte')
  getReporte(@Param('id', ParseIntPipe) id: number) {
    return this.service.getReporteComparativo(id);
  }

  @Roles(Rol.ANALISTA_COMPRAS, Rol.ADMIN)
  @Patch('solicitudes/:id/cerrar')
  cerrarManual(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.cerrarManual(id, req.user.id);
  }

  @Roles(Rol.ANALISTA_COMPRAS, Rol.ADMIN)
  @Patch('solicitudes/:id/seleccionar-ganador')
  seleccionarGanador(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SeleccionarGanadorDto,
  ) {
    return this.service.seleccionarGanador(id, dto);
  }

  @Roles(Rol.ANALISTA_COMPRAS, Rol.ADMIN)
  @Post('solicitudes/:id/nueva-ronda')
  crearNuevaRonda(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NuevaRondaCotizacionDto,
    @Request() req: any,
  ) {
    return this.service.crearNuevaRonda(id, dto, req.user.id, req.user.rol);
  }

  // ── Proveedor: enviar oferta ─────────────────────────────────────────────────

  @Roles(Rol.PROVEEDOR, Rol.ADMIN)
  @Post('ofertas')
  enviarOferta(@Body() dto: CreateOfertaDto, @Request() req: any) {
    return this.service.enviarOferta(dto, req.user.id);
  }

  @Roles(Rol.PROVEEDOR)
  @Get('mis-ofertas')
  getMisOfertas(@Request() req: any) {
    return this.service.getMisOfertas(req.user.id);
  }

  // ── Trigger manual de cierre automático (cron simplificado) ─────────────────

  @Roles(Rol.ADMIN, Rol.ANALISTA_COMPRAS)
  @Patch('cerrar-vencidas')
  cerrarVencidas() {
    return this.service.cerrarSolicitudesVencidas();
  }
}
