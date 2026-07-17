import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoItemRecepcion, EstadoOrdenCompra, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarDevolucionDto } from './dto/registrar-devolucion.dto';
import { RegistrarRecepcionDto } from './dto/registrar-recepcion.dto';

interface DetalleOrdenParaRecepcion {
  id: number;
  productoId: number | null;
  descripcion: string;
  cantidad: unknown;
}

interface DetalleRecepcionParaProgreso {
  ordenCompraDetalleId: number | null;
  productoId: number | null;
  descripcion: string;
  cantidadRecibida: unknown;
  estado: EstadoItemRecepcion;
}

@Injectable()
export class AlmacenService {
  constructor(private prisma: PrismaService) {}

  getOrdenesPendientes() {
    return this.prisma.ordenCompra.findMany({
      where: {
        estado: {
          in: [
            EstadoOrdenCompra.APROBADA,
            EstadoOrdenCompra.ENVIADA_PROVEEDOR,
            EstadoOrdenCompra.EN_RECEPCION,
            EstadoOrdenCompra.RECEPCION_PARCIAL,
          ],
        },
      },
      include: { proveedor: true, detalles: true },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  async getOrden(id: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        detalles: true,
        recepciones: { include: { detalles: true } },
      },
    });
    if (!orden) throw new NotFoundException('Orden de compra no encontrada');

    const recibidosPorDetalle = this.calcularRecibidosPorDetalle(
      orden.detalles,
      orden.recepciones.flatMap((recepcion) => recepcion.detalles),
    );

    return {
      ...orden,
      detalles: orden.detalles.map((detalle) => {
        const cantidadRecibidaAcumulada = recibidosPorDetalle.get(detalle.id) ?? 0;
        return {
          ...detalle,
          cantidadRecibidaAcumulada,
          cantidadPendiente: Math.max(0, Number(detalle.cantidad) - cantidadRecibidaAcumulada),
        };
      }),
    };
  }

  async registrarRecepcion(dto: RegistrarRecepcionDto, responsableId: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { id: dto.ordenCompraId },
      include: { detalles: true },
    });
    if (!orden) throw new NotFoundException('Orden de compra no encontrada');
    if (orden.detalles.length === 0) {
      throw new BadRequestException('La orden de compra no contiene productos para recibir');
    }
    const estadoAdmiteRecepcion =
      orden.estado === EstadoOrdenCompra.APROBADA
      || orden.estado === EstadoOrdenCompra.ENVIADA_PROVEEDOR
      || orden.estado === EstadoOrdenCompra.EN_RECEPCION
      || orden.estado === EstadoOrdenCompra.RECEPCION_PARCIAL;
    if (!estadoAdmiteRecepcion) {
      throw new BadRequestException('La orden no está habilitada para registrar recepciones');
    }

    return this.prisma.$transaction(async (tx) => {
      const detallesPrevios = await tx.recepcionDetalle.findMany({
        where: { recepcion: { ordenCompraId: orden.id } },
      });
      const recibidosPorDetalle = this.calcularRecibidosPorDetalle(orden.detalles, detallesPrevios);
      const itemsRegistrados = new Set<number>();

      const detallesParaCrear = dto.items.map((item) => {
        if (itemsRegistrados.has(item.ordenCompraDetalleId)) {
          throw new BadRequestException('No se puede registrar el mismo producto más de una vez en una recepción');
        }
        itemsRegistrados.add(item.ordenCompraDetalleId);

        const detalleOrden = orden.detalles.find((detalle) => detalle.id === item.ordenCompraDetalleId);
        if (!detalleOrden) {
          throw new BadRequestException(`Ítem ${item.ordenCompraDetalleId} no pertenece a esta orden de compra`);
        }

        const cantidadRecibida = Number(item.cantidadRecibida);
        const cantidadPendiente = Math.max(
          0,
          Number(detalleOrden.cantidad) - (recibidosPorDetalle.get(detalleOrden.id) ?? 0),
        );

        if (!Number.isFinite(cantidadRecibida) || cantidadRecibida < 0) {
          throw new BadRequestException(`La cantidad de "${detalleOrden.descripcion}" debe ser un número válido`);
        }
        if (cantidadPendiente <= 0) {
          throw new BadRequestException('La línea ya fue recibida por completo');
        }
        if (cantidadRecibida > cantidadPendiente) {
          throw new BadRequestException(
            `La cantidad de "${detalleOrden.descripcion}" supera el pendiente (${cantidadPendiente})`,
          );
        }
        if (item.estado === EstadoItemRecepcion.CONFORME && cantidadRecibida <= 0) {
          throw new BadRequestException(`Registre una cantidad mayor a cero para "${detalleOrden.descripcion}"`);
        }
        if (item.estado === EstadoItemRecepcion.FALTANTE && cantidadRecibida !== 0) {
          throw new BadRequestException(`Un ítem faltante debe tener cantidad recibida igual a cero`);
        }
        if (item.estado === EstadoItemRecepcion.DANADO) {
          if (cantidadRecibida <= 0) {
            throw new BadRequestException(`Registre la cantidad dañada de "${detalleOrden.descripcion}"`);
          }
          if (!item.observacion?.trim()) {
            throw new BadRequestException(`Indique la observación del producto dañado "${detalleOrden.descripcion}"`);
          }
          if (!item.motivoDevolucion?.trim()) {
            throw new BadRequestException(`Indique el motivo de devolución de "${detalleOrden.descripcion}"`);
          }
        }

        return {
          ordenCompraDetalleId: detalleOrden.id,
          productoId: detalleOrden.productoId,
          descripcion: detalleOrden.descripcion,
          cantidadEsperada: detalleOrden.cantidad,
          cantidadRecibida,
          estado: item.estado,
          observacion: item.observacion?.trim() || null,
          motivoDevolucion: item.motivoDevolucion?.trim() || null,
        };
      });

      if (!detallesParaCrear.some((detalle) => detalle.cantidadRecibida > 0)) {
        throw new BadRequestException('Registre al menos una unidad recibida o dañada');
      }

      const recepcion = await tx.recepcion.create({
        data: {
          ordenCompraId: dto.ordenCompraId,
          responsableId,
          observaciones: dto.observaciones?.trim() || null,
          detalles: {
            create: detallesParaCrear.map(({ motivoDevolucion, ...detalle }) => detalle),
          },
        },
        include: { detalles: true },
      });

      const detallesDañados = detallesParaCrear.filter(
        (detalle) => detalle.estado === EstadoItemRecepcion.DANADO,
      );
      await Promise.all(
        detallesDañados.map((detalle) => tx.devolucion.create({
          data: {
            recepcionId: recepcion.id,
            productoId: detalle.productoId,
            descripcion: detalle.descripcion,
            cantidad: detalle.cantidadRecibida,
            motivo: detalle.motivoDevolucion!,
          },
        })),
      );

      const alertas: string[] = [];
      for (const detalle of recepcion.detalles) {
        if (detalle.estado !== EstadoItemRecepcion.CONFORME || Number(detalle.cantidadRecibida) !== Number(detalle.cantidadEsperada)) {
          alertas.push(
            `${detalle.descripcion}: esperado ${detalle.cantidadEsperada}, recibido ${detalle.cantidadRecibida} (${detalle.estado})`,
          );
        }

        if (
          detalle.productoId
          && detalle.estado === EstadoItemRecepcion.CONFORME
          && Number(detalle.cantidadRecibida) > 0
        ) {
          await tx.inventario.upsert({
            where: { productoId: detalle.productoId },
            update: { cantidad: { increment: detalle.cantidadRecibida } },
            create: { productoId: detalle.productoId, cantidad: detalle.cantidadRecibida },
          });
        }
      }

      const todasLasRecepciones = await tx.recepcionDetalle.findMany({
        where: { recepcion: { ordenCompraId: orden.id } },
      });
      const acumuladosFinales = this.calcularRecibidosPorDetalle(orden.detalles, todasLasRecepciones);
      const recepcionCompleta = orden.detalles.every(
        (detalle) => (acumuladosFinales.get(detalle.id) ?? 0) >= Number(detalle.cantidad),
      );
      const hayRecepcionValida = Array.from(acumuladosFinales.values()).some((cantidad) => cantidad > 0);
      const estadoOrden = recepcionCompleta
        ? EstadoOrdenCompra.RECEPCION_COMPLETA
        : hayRecepcionValida
          ? EstadoOrdenCompra.RECEPCION_PARCIAL
          : orden.estado;
      const estadoRecepcion = recepcionCompleta
        ? 'COMPLETA'
        : hayRecepcionValida
          ? 'PARCIAL'
          : 'OBSERVADA';

      await Promise.all([
        tx.ordenCompra.update({ where: { id: orden.id }, data: { estado: estadoOrden } }),
        tx.recepcion.update({
          where: { id: recepcion.id },
          data: { estado: estadoRecepcion },
        }),
      ]);

      return {
        recepcion: { ...recepcion, estado: estadoRecepcion },
        alertas,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  getRecepciones() {
    return this.prisma.recepcion.findMany({
      include: {
        ordenCompra: { include: { proveedor: true } },
        detalles: { include: { producto: true } },
      },
      orderBy: { fechaRecepcion: 'desc' },
    });
  }

  async getRecepcion(id: number) {
    const rec = await this.prisma.recepcion.findUnique({
      where: { id },
      include: {
        ordenCompra: { include: { proveedor: true } },
        detalles: { include: { producto: true } },
        guias: true,
        devoluciones: { include: { producto: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!rec) throw new NotFoundException('Recepción no encontrada');

    const responsable = rec.responsableId
      ? await this.prisma.usuario.findUnique({
        where: { id: rec.responsableId },
        select: { id: true, nombre: true, apellido: true, email: true },
      })
      : null;

    return { ...rec, responsable };
  }

  async generarGuia(recepcionId: number, emisor: string, receptor: string) {
    const recepcion = await this.prisma.recepcion.findUnique({ where: { id: recepcionId } });
    if (!recepcion) throw new NotFoundException('Recepción no encontrada');
    const count = await this.prisma.guiaRemision.count();
    const numero = `GR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.guiaRemision.create({ data: { numero, recepcionId, emisor, receptor, fechaEmision: new Date() } });
  }

  async getInventario() {
    const items = await this.prisma.inventario.findMany({ include: { producto: true } });
    return items.map((item) => ({ ...item, stockBajo: Number(item.cantidad) <= Number(item.stockMinimo) }));
  }

  async getMovimientos(productoId?: number) {
    const [entradas, salidas] = await Promise.all([
      this.prisma.recepcionDetalle.findMany({
        where: { estado: { not: EstadoItemRecepcion.DANADO }, ...(productoId ? { productoId } : {}) },
        include: { recepcion: true },
        orderBy: { id: 'desc' },
        take: productoId ? undefined : 50,
      }),
      this.prisma.devolucion.findMany({
        where: productoId ? { productoId } : {},
        orderBy: { createdAt: 'desc' },
        take: productoId ? undefined : 50,
      }),
    ]);
    const ids = [...new Set([...entradas.map((entrada) => entrada.productoId), ...salidas.map((salida) => salida.productoId)].filter((value): value is number => !!value))];
    const productos = await this.prisma.producto.findMany({ where: { id: { in: ids } } });
    const nombre = (productoId?: number | null) => productos.find((producto) => producto.id === productoId)?.nombre;

    return [
      ...entradas.map((entrada) => ({
        id: entrada.id,
        productoId: entrada.productoId,
        tipo: 'ENTRADA' as const,
        origen: 'RECEPCION' as const,
        origenId: entrada.recepcionId,
        producto: nombre(entrada.productoId) ?? entrada.descripcion,
        cantidad: entrada.cantidadRecibida,
        fecha: entrada.recepcion.fechaRecepcion,
        referencia: `Recepción #${entrada.recepcionId}`,
        detalle: entrada.observacion,
        enlace: `/recepciones/registradas/${entrada.recepcionId}`,
      })),
      ...salidas.map((salida) => ({
        id: salida.id,
        productoId: salida.productoId,
        tipo: 'SALIDA' as const,
        origen: 'DEVOLUCION' as const,
        origenId: salida.id,
        producto: nombre(salida.productoId) ?? salida.descripcion,
        cantidad: salida.cantidad,
        fecha: salida.createdAt,
        referencia: `Devolución #${salida.id}`,
        detalle: salida.motivo,
        enlace: '/devoluciones',
      })),
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  async registrarDevolucion(dto: RegistrarDevolucionDto, usuarioId: number) {
    const recepcion = await this.prisma.recepcion.findUnique({
      where: { id: dto.recepcionId },
      include: { ordenCompra: { include: { proveedor: true } } },
    });
    if (!recepcion) throw new NotFoundException('Recepción no encontrada');

    const devolucion = await this.prisma.devolucion.create({ data: { ...dto } });
    const email = recepcion.ordenCompra.proveedor?.email;
    const usuarioProveedor = email ? await this.prisma.usuario.findUnique({ where: { email } }) : null;

    if (usuarioProveedor) {
      await this.prisma.notificacion.create({
        data: {
          emisorId: usuarioId,
          receptorId: usuarioProveedor.id,
          titulo: 'Mercancía rechazada',
          mensaje: `Se registró una devolución de "${dto.descripcion}" (${dto.cantidad}) - Motivo: ${dto.motivo}`,
        },
      });
      await this.prisma.devolucion.update({ where: { id: devolucion.id }, data: { notificada: true } });
    }
    return devolucion;
  }

  getDevoluciones() {
    return this.prisma.devolucion.findMany({
      include: { recepcion: { include: { ordenCompra: { include: { proveedor: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calcularRecibidosPorDetalle(
    detallesOrden: DetalleOrdenParaRecepcion[],
    detallesRecepcion: DetalleRecepcionParaProgreso[],
  ) {
    const recibidosPorDetalle = new Map<number, number>();

    for (const detalleRecepcion of detallesRecepcion) {
      if (detalleRecepcion.estado !== EstadoItemRecepcion.CONFORME) continue;

      const detalleId = detalleRecepcion.ordenCompraDetalleId
        ?? this.encontrarDetalleLegacy(detallesOrden, detalleRecepcion);
      if (!detalleId) continue;

      recibidosPorDetalle.set(
        detalleId,
        (recibidosPorDetalle.get(detalleId) ?? 0) + Number(detalleRecepcion.cantidadRecibida),
      );
    }

    return recibidosPorDetalle;
  }

  private encontrarDetalleLegacy(
    detallesOrden: DetalleOrdenParaRecepcion[],
    detalleRecepcion: DetalleRecepcionParaProgreso,
  ) {
    const coincidenciasPorProducto = detalleRecepcion.productoId
      ? detallesOrden.filter((detalle) => detalle.productoId === detalleRecepcion.productoId)
      : [];
    if (coincidenciasPorProducto.length === 1) return coincidenciasPorProducto[0].id;

    const coincidenciasPorDescripcion = detallesOrden.filter(
      (detalle) => detalle.descripcion === detalleRecepcion.descripcion,
    );
    return coincidenciasPorDescripcion.length === 1 ? coincidenciasPorDescripcion[0].id : undefined;
  }
}