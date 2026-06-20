import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async findAll(soloActivos = false) {
    return this.prisma.producto.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }

    return producto;
  }

  async create(dto: CreateProductoDto) {
    return this.prisma.producto.create({
      data: this.buildCreateProductoData(dto),
    });
  }

  async update(id: number, dto: UpdateProductoDto) {
    await this.findOne(id);

    return this.prisma.producto.update({
      where: { id },
      data: this.buildUpdateProductoData(dto),
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const [
      requerimientos,
      inventario,
      recepciones,
      devoluciones,
      ordenesCompra,
    ] = await Promise.all([
      this.prisma.requerimientoDetalle.count({ where: { productoId: id } }),
      this.prisma.inventario.count({ where: { productoId: id } }),
      this.prisma.recepcionDetalle.count({ where: { productoId: id } }),
      this.prisma.devolucion.count({ where: { productoId: id } }),
      this.prisma.ordenCompraDetalle.count({ where: { productoId: id } }),
    ]);

    const referencias = [
      { nombre: 'requerimientos', total: requerimientos },
      { nombre: 'inventario', total: inventario },
      { nombre: 'recepciones', total: recepciones },
      { nombre: 'devoluciones', total: devoluciones },
      { nombre: 'ordenes de compra', total: ordenesCompra },
    ].filter((referencia) => referencia.total > 0);

    if (referencias.length > 0) {
      const detalle = referencias
        .map((referencia) => `${referencia.nombre}: ${referencia.total}`)
        .join(', ');
      throw new BadRequestException(
        `No se puede eliminar el producto porque tiene referencias activas (${detalle}). Desactivalo en su lugar.`,
      );
    }

    return this.prisma.producto.delete({ where: { id } });
  }

  private buildCreateProductoData(
    dto: CreateProductoDto,
  ): Prisma.ProductoCreateInput {
    return {
      codigo: dto.codigo.trim().toUpperCase(),
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
      unidadMedida: dto.unidadMedida.trim(),
      categoria: dto.categoria.trim(),
      precioReferencial: dto.precioReferencial,
      activo: dto.activo ?? true,
    };
  }

  private buildUpdateProductoData(
    dto: UpdateProductoDto,
  ): Prisma.ProductoUpdateInput {
    const data: Prisma.ProductoUpdateInput = {};

    if (dto.codigo !== undefined) data.codigo = dto.codigo.trim().toUpperCase();
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) {
      data.descripcion = dto.descripcion.trim() || null;
    }
    if (dto.unidadMedida !== undefined) data.unidadMedida = dto.unidadMedida.trim();
    if (dto.categoria !== undefined) data.categoria = dto.categoria.trim();
    if (dto.precioReferencial !== undefined) {
      data.precioReferencial = dto.precioReferencial;
    }
    if (dto.activo !== undefined) data.activo = dto.activo;

    return data;
  }
}
