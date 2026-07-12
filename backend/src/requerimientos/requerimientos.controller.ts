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
import { RequerimientosService } from './requerimientos.service';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateRequerimientoDto } from './dto/update-requerimiento.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requerimientos')
export class RequerimientosController {
  constructor(private service: RequerimientosService) {}

  @Roles(Rol.TRABAJADOR, Rol.ADMIN)
  @Post()
  create(@Body() dto: CreateRequerimientoDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Roles(Rol.TRABAJADOR, Rol.ADMIN, Rol.JEFE_AREA, Rol.GERENTE, Rol.ANALISTA_COMPRAS)
  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id, req.user.rol);
  }

  @Roles(Rol.JEFE_AREA, Rol.ADMIN, Rol.GERENTE, Rol.ANALISTA_COMPRAS)
  @Get('pendientes')
  findPendientes(@Request() req: any) {
    return this.service.findPendientes(req.user.id, req.user.rol);
  }

  @Get('estadisticas/mis-requerimientos')
  getMisEstadisticas(@Request() req: any) {
    return this.service.getMisEstadisticas(req.user.id);
  }

  @Roles(Rol.JEFE_AREA, Rol.ADMIN, Rol.GERENTE)
  @Get('estadisticas/jefe')
  getEstadisticasJefe() {
    return this.service.getEstadisticasJefe();
  }

  @Roles(Rol.TRABAJADOR, Rol.ADMIN, Rol.JEFE_AREA, Rol.GERENTE, Rol.ANALISTA_COMPRAS)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.findOne(id, req.user.id, req.user.rol);
  }

  @Roles(Rol.TRABAJADOR, Rol.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequerimientoDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.id, req.user.rol);
  }

  @Roles(Rol.TRABAJADOR, Rol.ADMIN)
  @Patch(':id/enviar')
  submitParaAprobacion(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.submitParaAprobacion(id, req.user.id);
  }

  @Roles(Rol.JEFE_AREA, Rol.GERENTE, Rol.ADMIN)
  @Patch(':id/estado')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
    @Request() req: any,
  ) {
    return this.service.updateEstado(id, dto, req.user.id, req.user.rol);
  }
}
