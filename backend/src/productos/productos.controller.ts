import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProductoDto } from './dto/create-producto.dto';
import { CreateProductoFromRequerimientoDto } from './dto/create-producto-from-requerimiento.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductosService } from './productos.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll(@Query('soloActivos') soloActivos?: string) {
    return this.productosService.findAll(soloActivos === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ANALISTA_COMPRAS, Rol.ENCARGADO_ALMACEN, Rol.JEFE_AREA)
  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  @Roles(Rol.TRABAJADOR, Rol.ADMIN)
  @Post('desde-requerimiento')
  createFromRequerimiento(
    @Body() dto: CreateProductoFromRequerimientoDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.productosService.createFromRequerimiento(dto, req.user.id);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ANALISTA_COMPRAS, Rol.ENCARGADO_ALMACEN)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @Roles(Rol.ADMIN, Rol.GERENTE, Rol.ANALISTA_COMPRAS)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}
