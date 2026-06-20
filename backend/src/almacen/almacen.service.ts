import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'; 
import { PrismaService } from '../prisma/prisma.service'; 
import { RegistrarRecepcionDto } from './dto/registrar-recepcion.dto'; 
import { RegistrarDevolucionDto } from './dto/registrar-devolucion.dto'; 
import { EstadoOrdenCompra, EstadoItemRecepcion } from '@prisma/client'; 
 
@Injectable() 
export class AlmacenService { 
  constructor(private prisma: PrismaService) {} 
 
  getOrdenesPendientes() { 
    return this.prisma.ordenCompra.findMany({ 
      where: { estado: { in: [EstadoOrdenCompra.APROBADA, EstadoOrdenCompra.ENVIADA, EstadoOrdenCompra.RECIBIDA_PARCIAL] } }, 
      include: { proveedor: true, detalles: true }, 
      orderBy: { fechaEmision: 'desc' }, 
    }); 
  } 
 
  async getOrden(id: number) { 
    const orden = await this.prisma.ordenCompra.findUnique({ 
      where: { id }, 
      include: { proveedor: true, detalles: true, recepciones: { include: { detalles: true } } }, 
    }); 
    if (!orden) throw new NotFoundException('Orden de compra no encontrada'); 
    return orden; 
  } 
 
  async registrarRecepcion(dto: RegistrarRecepcionDto, responsableId: number) { 
    const orden = await this.prisma.ordenCompra.findUnique({ 
      where: { id: dto.ordenCompraId }, 
      include: { detalles: true }, 
    }); 
    if (!orden) throw new NotFoundException('Orden de compra no encontrada'); 
    if (['RECIBIDA_COMPLETA', 'CANCELADA'].includes(orden.estado)) { 
      throw new BadRequestException('Esta orden ya no admite recepciones'); 
    } 
 
    return this.prisma.$transaction(async (tx) => { 
      const recepcion = await tx.recepcion.create({ 
        data: { 
          ordenCompraId: dto.ordenCompraId, 
          responsableId, 
          observaciones: dto.observaciones, 
          detalles: { 
            create: dto.items.map((item) => { 
              const ocDetalle = orden.detalles.find((d) => d.id === item.ordenCompraDetalleId); 
              if (!ocDetalle) throw new BadRequestException(`Ítem ${item.ordenCompraDetalleId} no pertenece a esta OC`); 
              return { 
                productoId: ocDetalle.productoId, 
                descripcion: ocDetalle.descripcion, 
                cantidadEsperada: ocDetalle.cantidad, 
                cantidadRecibida: item.cantidadRecibida, 
                estado: item.estado as EstadoItemRecepcion, 
                observacion: item.observacion, 
              }; 
            }), 
          }, 
        }, 
        include: { detalles: true }, 
      }); 
 
      const alertas: string[] = []; 
      for (const det of recepcion.detalles) { 
        const diff = Number(det.cantidadRecibida) - Number(det.cantidadEsperada); 
        if (diff !== 0 || det.estado !== 'CONFORME') { 
          alertas.push(`${det.descripcion}: esperado ${det.cantidadEsperada}, recibido ${det.cantidadRecibida} (${det.estado})`); 
        } 
        if (det.productoId && det.estado !== 'DANADO' && Number(det.cantidadRecibida) > 0) { 
          await tx.inventario.upsert({ 
            where: { productoId: det.productoId }, 
            update: { cantidad: { increment: det.cantidadRecibida } }, 
            create: { productoId: det.productoId, cantidad: det.cantidadRecibida }, 
          }); 
        } 
      } 
 
      const todasLasRecepciones = await tx.recepcionDetalle.findMany({ where: { recepcion: { ordenCompraId: orden.id } } }); 
      const totalPedido = orden.detalles.reduce((s, d) => s + Number(d.cantidad), 0); 
      const totalRecibido = todasLasRecepciones.reduce((s, d) => s + Number(d.cantidadRecibida), 0); 
 
      await tx.ordenCompra.update({ 
        where: { id: orden.id }, 
        data: { estado: totalRecibido >= totalPedido ? EstadoOrdenCompra.RECIBIDA_COMPLETA : EstadoOrdenCompra.RECIBIDA_PARCIAL }, 
      }); 
 
      return { recepcion, alertas }; 
    }); 
  } 
 
  getRecepciones() { 
    return this.prisma.recepcion.findMany({ 
      include: { 
        ordenCompra: { include: { proveedor: true } }, 
        detalles: { include: { producto: true } } 
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
        guias: true 
      }, 
    }); 
    if (!rec) throw new NotFoundException('Recepción no encontrada'); 
    return rec; 
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
    return items.map((i) => ({ ...i, stockBajo: Number(i.cantidad) <= Number(i.stockMinimo) })); 
  } 
 
  async getMovimientos(productoId?: number) { 
    const [entradas, salidas] = await Promise.all([ 
      this.prisma.recepcionDetalle.findMany({ 
        where: { estado: { not: 'DANADO' }, ...(productoId ? { productoId } : {}) }, 
        include: { recepcion: true }, 
        orderBy: { id: 'desc' }, 
        take: 50, 
      }), 
      this.prisma.devolucion.findMany({ where: productoId ? { productoId } : {}, orderBy: { createdAt: 'desc' }, take: 50 }), 
    ]); 
    const ids = [...new Set([...entradas.map((e) => e.productoId), ...salidas.map((s) => s.productoId)].filter((x): x is number => !!x))]; 
    const productos = await this.prisma.producto.findMany({ where: { id: { in: ids } } }); 
    const nombre = (id?: number | null) => productos.find((p) => p.id === id)?.nombre; 
 
    return [ 
      ...entradas.map((e) => ({ tipo: 'ENTRADA', producto: nombre(e.productoId) ?? e.descripcion, cantidad: e.cantidadRecibida, fecha: e.recepcion.fechaRecepcion, referencia: `Recepción #${e.recepcionId}` })), 
      ...salidas.map((s) => ({ tipo: 'SALIDA', producto: nombre(s.productoId) ?? s.descripcion, cantidad: s.cantidad, fecha: s.createdAt, referencia: `Devolución #${s.id}` })), 
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
          mensaje: `Se registró una devolución de "${dto.descripcion}" (${dto.cantidad}) — Motivo: ${dto.motivo}`, 
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
} 
