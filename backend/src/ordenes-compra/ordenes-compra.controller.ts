import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { OrdenesCompraService } from './ordenes-compra.service';
import { GenerarOrdenDto } from './dto/generar-orden.dto';
import { AprobarOrdenDto } from './dto/aprobar-orden.dto';
import { SolicitarRevisionDto } from './dto/solicitar-revision.dto';
import { RechazarOrdenDto } from './dto/rechazar-orden.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ordenes-compra')
export class OrdenesCompraController {
  constructor(private readonly service: OrdenesCompraService) {}

  // ─── Generar OC desde solicitud adjudicada (Analista/Admin) ─────────────────
  @Roles(Rol.ANALISTA_COMPRAS, Rol.ADMIN)
  @Post('generar')
  async generar(@Body() dto: GenerarOrdenDto, @Request() req: any) {
    return this.service.generarOrden(dto, req.user.id);
  }

  // ─── Listar órdenes ────────────────────────────────────────────────────────
  @Get()
  async findAll(@Request() req: any) {
    return this.service.findAll(req.user.rol, req.user.id);
  }

  // ─── Obtener detalle de una orden ───────────────────────────────────────────
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // ─── Obtener expediente digital (para Gerente) ──────────────────────────────
  @Roles(Rol.GERENTE, Rol.ADMIN)
  @Get(':id/expediente')
  async getExpediente(@Param('id', ParseIntPipe) id: number) {
    return this.service.getExpediente(id);
  }

  // ─── Aprobar OC (Gerente) ───────────────────────────────────────────────────
  @Roles(Rol.GERENTE, Rol.ADMIN)
  @Patch(':id/aprobar')
  async aprobar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarOrdenDto,
    @Request() req: any,
  ) {
    return this.service.aprobar(id, dto, req.user.id);
  }

  // ─── Solicitar revisión (Gerente) ────────────────────────────────────────────
  @Roles(Rol.GERENTE, Rol.ADMIN)
  @Patch(':id/solicitar-revision')
  async solicitarRevision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SolicitarRevisionDto,
    @Request() req: any,
  ) {
    return this.service.solicitarRevision(id, dto, req.user.id);
  }

  // ─── Rechazar OC (Gerente) ──────────────────────────────────────────────────
  @Roles(Rol.GERENTE, Rol.ADMIN)
  @Patch(':id/rechazar')
  async rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RechazarOrdenDto,
    @Request() req: any,
  ) {
    return this.service.rechazar(id, dto, req.user.id);
  }

  // ─── Obtener órdenes pendientes de recepción (Almacén) ───────────────────────
  @Roles(Rol.ENCARGADO_ALMACEN, Rol.ADMIN, Rol.GERENTE)
  @Get('pendientes-recepcion')
  async getPendientesRecepcion() {
    return this.service.getPendientesRecepcion();
  }

  // ─── Descargar PDF (todos los roles autorizados) ────────────────────────────
  @Get(':id/pdf')
  async getPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.service.generatePdf(id, res);
  }
}
