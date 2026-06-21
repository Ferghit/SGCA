import { Controller, Get, UseGuards, Query, Res } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private service: ReportesService) {}

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('kpis')
  getKPIs(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.service.getKPIs(fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('compras')
  getReporteCompras(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.service.getReporteCompras(fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('proveedores')
  getReporteProveedores() {
    return this.service.getReporteProveedores();
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('productos/rotacion')
  getProductosRotacion(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.service.getProductosRotacion(fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ENCARGADO_ALMACEN)
  @Get('productos/stock-critico')
  getStockCritico() {
    return this.service.getStockCritico();
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('compras/pdf')
  async downloadComprasPDF(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Res() res?: Response,
  ) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-compras.pdf"');
    await this.service.generateComprasPDF(res, fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('proveedores/pdf')
  async downloadProveedoresPDF(@Res() res?: Response) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-proveedores.pdf"');
    await this.service.generateProveedoresPDF(res);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ENCARGADO_ALMACEN)
  @Get('productos/stock-critico/pdf')
  async downloadStockCriticoPDF(@Res() res?: Response) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-stock-critico.pdf"');
    await this.service.generateStockCriticoPDF(res);
  }

  // --- OPERATIONAL REPORTS (LIST) ---
  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/usuarios')
  getOperativoUsuarios() {
    return this.service.getOperativoUsuarios();
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/productos')
  getOperativoProductos() {
    return this.service.getOperativoProductos();
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/requerimientos')
  getOperativoRequerimientos(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.service.getOperativoRequerimientos(fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/solicitudes-cotizacion')
  getOperativoSolicitudesCotizacion(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.service.getOperativoSolicitudesCotizacion(fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/ordenes-compra')
  getOperativoOrdenesCompra(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.service.getOperativoOrdenesCompra(fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ENCARGADO_ALMACEN)
  @Get('operativos/recepciones')
  getOperativoRecepciones(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.service.getOperativoRecepciones(fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ENCARGADO_ALMACEN)
  @Get('operativos/inventario')
  getOperativoInventario() {
    return this.service.getOperativoInventario();
  }

  // --- OPERATIONAL REPORTS (PDF) ---
  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/usuarios/pdf')
  async downloadOperativoUsuariosPDF(@Res() res?: Response) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-usuarios.pdf"');
    await this.service.generateOperativoUsuariosPDF(res);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/productos/pdf')
  async downloadOperativoProductosPDF(@Res() res?: Response) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-productos.pdf"');
    await this.service.generateOperativoProductosPDF(res);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/requerimientos/pdf')
  async downloadOperativoRequerimientosPDF(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Res() res?: Response,
  ) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-requerimientos.pdf"');
    await this.service.generateOperativoRequerimientosPDF(res, fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/solicitudes-cotizacion/pdf')
  async downloadOperativoSolicitudesCotizacionPDF(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Res() res?: Response,
  ) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-solicitudes-cotizacion.pdf"');
    await this.service.generateOperativoSolicitudesCotizacionPDF(res, fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE)
  @Get('operativos/ordenes-compra/pdf')
  async downloadOperativoOrdenesCompraPDF(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Res() res?: Response,
  ) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-ordenes-compra.pdf"');
    await this.service.generateOperativoOrdenesCompraPDF(res, fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ENCARGADO_ALMACEN)
  @Get('operativos/recepciones/pdf')
  async downloadOperativoRecepcionesPDF(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Res() res?: Response,
  ) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-recepciones.pdf"');
    await this.service.generateOperativoRecepcionesPDF(res, fechaInicio, fechaFin);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ENCARGADO_ALMACEN)
  @Get('operativos/inventario/pdf')
  async downloadOperativoInventarioPDF(@Res() res?: Response) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-inventario.pdf"');
    await this.service.generateOperativoInventarioPDF(res);
  }
}
