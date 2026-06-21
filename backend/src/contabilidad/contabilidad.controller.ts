import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Rol } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContabilidadService } from './contabilidad.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contabilidad')
export class ContabilidadController {
  constructor(private readonly service: ContabilidadService) {}

  @Roles(Rol.CONTADOR, Rol.ADMIN)
  @Get('ordenes-para-facturar')
  getOrdenesParaFacturar() {
    return this.service.getOrdenesParaFacturar();
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN, Rol.GERENTE)
  @Get('facturas')
  getFacturas() {
    return this.service.getFacturas();
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN, Rol.GERENTE)
  @Get('facturas/:id')
  getFactura(@Param('id', ParseIntPipe) id: number) {
    return this.service.getFactura(id);
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN)
  @Post('facturas')
  crearFactura(@Body() dto: CreateFacturaDto, @Request() req: any) {
    return this.service.crearFactura(dto, req.user.id);
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN)
  @Patch('facturas/:id/pago')
  actualizarPago(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePagoDto) {
    return this.service.actualizarEstadoPago(id, dto);
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN, Rol.GERENTE)
  @Get('facturas/:id/pdf')
  descargarFactura(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.service.generarFacturaPdf(id, res);
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN, Rol.GERENTE)
  @Get('pagos')
  getPagos() {
    return this.service.getPagos();
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN)
  @Post('incidencias')
  crearIncidencia(@Body() dto: CreateIncidenciaDto) {
    return this.service.crearIncidencia(dto);
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN, Rol.GERENTE)
  @Get('incidencias')
  getIncidencias() {
    return this.service.getIncidencias();
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN)
  @Patch('incidencias/:id/resolver')
  resolverIncidencia(@Param('id', ParseIntPipe) id: number) {
    return this.service.resolverIncidencia(id);
  }

  @Roles(Rol.CONTADOR, Rol.ADMIN, Rol.GERENTE)
  @Get('desempeno-proveedores')
  getDesempeno() {
    return this.service.getDesempeno();
  }
}
