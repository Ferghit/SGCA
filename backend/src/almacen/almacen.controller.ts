import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common'; 
import { AlmacenService } from './almacen.service'; 
import { RegistrarRecepcionDto } from './dto/registrar-recepcion.dto'; 
import { RegistrarDevolucionDto } from './dto/registrar-devolucion.dto'; 
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'; 
import { RolesGuard } from '../common/guards/roles.guard'; 
import { Roles } from '../common/decorators/roles.decorator'; 
import { Rol } from '@prisma/client'; 
 
@UseGuards(JwtAuthGuard, RolesGuard) 
@Roles(Rol.ENCARGADO_ALMACEN, Rol.ADMIN) 
@Controller('almacen') 
export class AlmacenController { 
  constructor(private service: AlmacenService) {} 
 
  @Get('ordenes-pendientes') 
  getOrdenesPendientes() { 
    return this.service.getOrdenesPendientes(); 
  } 
 
  @Get('ordenes/:id') 
  getOrden(@Param('id', ParseIntPipe) id: number) { 
    return this.service.getOrden(id); 
  } 
 
  @Post('recepciones') 
  registrarRecepcion(@Body() dto: RegistrarRecepcionDto, @Request() req: any) { 
    return this.service.registrarRecepcion(dto, req.user.id); 
  } 
 
  @Get('recepciones') 
  getRecepciones() { 
    return this.service.getRecepciones(); 
  } 
 
  @Get('recepciones/:id') 
  getRecepcion(@Param('id', ParseIntPipe) id: number) { 
    return this.service.getRecepcion(id); 
  } 
 
  @Post('recepciones/:id/guia-remision') 
  generarGuia(@Param('id', ParseIntPipe) id: number, @Body() body: { emisor: string; receptor: string }) { 
    return this.service.generarGuia(id, body.emisor, body.receptor); 
  } 
 
  @Get('inventario') 
  getInventario() { 
    return this.service.getInventario(); 
  } 
 
  @Get('inventario/movimientos') 
  getMovimientos(@Query('productoId') productoId?: string) { 
    return this.service.getMovimientos(productoId ? Number(productoId) : undefined); 
  } 
 
  @Post('devoluciones') 
  registrarDevolucion(@Body() dto: RegistrarDevolucionDto, @Request() req: any) { 
    return this.service.registrarDevolucion(dto, req.user.id); 
  } 
 
  @Get('devoluciones') 
  getDevoluciones() { 
    return this.service.getDevoluciones(); 
  } 
} 
