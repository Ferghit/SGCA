import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { CreateProductoFromRequerimientoDto } from './dto/create-producto-from-requerimiento.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    private prisma: PrismaService,
    private notificacionesService: NotificacionesService,
  ) {}

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

  async createFromRequerimiento(dto: CreateProductoFromRequerimientoDto, usuarioId: number) {
    const nombre = dto.nombre.trim();
    const existente = await this.prisma.producto.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un producto con el nombre "${existente.nombre}" (${existente.codigo}). Selecciónalo del catálogo.`,
      );
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const codigo = await this.generarCodigoProducto();

    const producto = await this.prisma.producto.create({
      data: {
        codigo,
        nombre,
        descripcion: dto.descripcion?.trim() || null,
        unidadMedida: dto.unidadMedida.trim(),
        categoria: dto.categoria.trim(),
        precioReferencial: dto.precioReferencial ?? null,
        activo: true,
      },
    });

    await this.notificarAdminsNuevoProducto(producto, usuario);

    return producto;
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

  private async generarCodigoProducto(): Promise<string> {
    const productos = await this.prisma.producto.findMany({
      where: { codigo: { startsWith: 'PRD-' } },
      select: { codigo: true },
    });

    const maxSecuencia = productos.reduce((max, producto) => {
      const suffix = parseInt(producto.codigo.replace(/^PRD-/i, ''), 10);
      return Number.isNaN(suffix) ? max : Math.max(max, suffix);
    }, 0);

    return `PRD-${String(maxSecuencia + 1).padStart(3, '0')}`;
  }

  private async notificarAdminsNuevoProducto(
    producto: {
      id: number;
      codigo: string;
      nombre: string;
      categoria: string;
      unidadMedida: string;
      descripcion: string | null;
      createdAt: Date;
    },
    usuario: { id: number; nombre: string; apellido: string; email: string },
  ) {
    const admins = await this.prisma.usuario.findMany({
      where: { rol: Rol.ADMIN, activo: true },
      select: { id: true },
    });

    if (admins.length === 0) return;

    const fecha = producto.createdAt.toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const detalleDescripcion = producto.descripcion
      ? ` Descripción: ${producto.descripcion}.`
      : '';

    const mensaje =
      `${usuario.nombre} ${usuario.apellido} (${usuario.email}) registró un nuevo producto en el catálogo ` +
      `el ${fecha}. Código: ${producto.codigo}. Nombre: ${producto.nombre}. ` +
      `Categoría: ${producto.categoria}. Unidad: ${producto.unidadMedida}.${detalleDescripcion}`;

    await Promise.all(
      admins.map((admin) =>
        this.notificacionesService.crear({
          emisorId: usuario.id,
          receptorId: admin.id,
          titulo: 'Nuevo producto agregado al catálogo',
          mensaje,
        }),
      ),
    );
  }
}
