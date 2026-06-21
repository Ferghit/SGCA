import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import {
  EstadoCruceFactura,
  EstadoFactura,
  EstadoIncidencia,
  EstadoPago,
  TipoIncidencia,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';

@Injectable()
export class ContabilidadService {
  constructor(private prisma: PrismaService) {}

  async getOrdenesParaFacturar() {
    return this.prisma.ordenCompra.findMany({
      where: {
        estado: { in: ['RECEPCION_PARCIAL', 'RECEPCION_COMPLETA', 'CERRADA'] },
      },
      include: {
        proveedor: true,
        detalles: true,
        recepciones: { include: { detalles: true, guias: true } },
        facturas: true,
      },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  async getFacturas() {
    return this.prisma.factura.findMany({
      include: {
        proveedor: true,
        ordenCompra: { include: { detalles: true, recepciones: { include: { guias: true, detalles: true } } } },
        detalles: true,
        pagos: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFactura(id: number) {
    const factura = await this.prisma.factura.findUnique({
      where: { id },
      include: {
        proveedor: true,
        ordenCompra: {
          include: {
            proveedor: true,
            detalles: true,
            recepciones: { include: { detalles: true, guias: true } },
          },
        },
        detalles: true,
        pagos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!factura) throw new NotFoundException('Factura no encontrada');
    return factura;
  }

  async crearFactura(dto: CreateFacturaDto, contadorId: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { id: dto.ordenCompraId },
      include: {
        proveedor: true,
        detalles: true,
        recepciones: { include: { detalles: true, guias: true } },
      },
    });

    if (!orden) throw new NotFoundException('Orden de compra no encontrada');
    if (!dto.detalles?.length) throw new BadRequestException('La factura debe tener al menos un detalle');

    const subtotal = dto.detalles.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);
    const igv = Number((subtotal * 0.18).toFixed(2));
    const total = Number((subtotal + igv).toFixed(2));
    const resultadoCruce = this.calcularCruce(orden, dto.detalles, subtotal, igv, total);
    const conforme = resultadoCruce.discrepancias.length === 0;

    const factura = await this.prisma.$transaction(async (tx) => {
      const created = await tx.factura.create({
        data: {
          numero: dto.numero,
          proveedorId: orden.proveedorId,
          ordenCompraId: orden.id,
          monto: subtotal,
          igv,
          total,
          fechaEmision: new Date(dto.fechaEmision),
          fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
          estado: conforme ? EstadoFactura.APROBADA : EstadoFactura.OBSERVADA,
          estadoPago: conforme ? EstadoPago.PENDIENTE : EstadoPago.OBSERVADO,
          estadoCruce: conforme ? EstadoCruceFactura.CONFORME : EstadoCruceFactura.OBSERVADA,
          resultadoCruce,
          observacionesCruce: resultadoCruce.discrepancias.join(' | ') || null,
          archivoUrl: dto.archivoUrl,
          contadorId,
          detalles: {
            create: dto.detalles.map((item) => ({
              productoId: item.productoId,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: Number((item.cantidad * item.precioUnitario).toFixed(2)),
            })),
          },
        },
      });

      if (!conforme) {
        await tx.incidenciaProveedor.create({
          data: {
            proveedorId: orden.proveedorId,
            ordenCompraId: orden.id,
            tipo: TipoIncidencia.RECLAMO,
            descripcion: `Cruce observado en factura ${dto.numero}: ${resultadoCruce.discrepancias.join('; ')}`,
            impacto: Math.min(5, Math.max(2, resultadoCruce.discrepancias.length)),
          },
        });
      }

      return created;
    });

    await this.actualizarDesempenoProveedor(orden.proveedorId);
    return this.getFactura(factura.id);
  }

  async actualizarEstadoPago(facturaId: number, dto: UpdatePagoDto) {
    const factura = await this.getFactura(facturaId);

    await this.prisma.$transaction(async (tx) => {
      await tx.factura.update({
        where: { id: facturaId },
        data: {
          estadoPago: dto.estado,
          estado:
            dto.estado === EstadoPago.PROCESADO
              ? EstadoFactura.PAGADA
              : dto.estado === EstadoPago.OBSERVADO
                ? EstadoFactura.OBSERVADA
                : factura.estado,
        },
      });

      if (dto.estado === EstadoPago.PROCESADO) {
        await tx.pago.create({
          data: {
            facturaId,
            monto: dto.monto ?? Number(factura.total),
            metodoPago: dto.metodoPago || 'Transferencia bancaria',
            referencia: dto.referencia,
            estado: dto.estado,
            observaciones: dto.observaciones,
          },
        });
      }
    });

    await this.actualizarDesempenoProveedor(factura.proveedorId);
    return this.getFactura(facturaId);
  }

  async getPagos() {
    return this.prisma.pago.findMany({
      include: { factura: { include: { proveedor: true, ordenCompra: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async crearIncidencia(dto: CreateIncidenciaDto) {
    const incidencia = await this.prisma.incidenciaProveedor.create({
      data: {
        proveedorId: dto.proveedorId,
        ordenCompraId: dto.ordenCompraId,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        impacto: dto.impacto ?? 1,
        accionCorrectiva: dto.accionCorrectiva,
      },
      include: { proveedor: true, ordenCompra: true },
    });

    await this.actualizarDesempenoProveedor(dto.proveedorId);
    return incidencia;
  }

  async getIncidencias() {
    return this.prisma.incidenciaProveedor.findMany({
      include: { proveedor: true, ordenCompra: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolverIncidencia(id: number) {
    const incidencia = await this.prisma.incidenciaProveedor.update({
      where: { id },
      data: { estado: EstadoIncidencia.RESUELTA },
      include: { proveedor: true, ordenCompra: true },
    });
    await this.actualizarDesempenoProveedor(incidencia.proveedorId);
    return incidencia;
  }

  async getDesempeno() {
    await this.recalcularTodosDesempenos();
    return this.prisma.desempenoProveedor.findMany({
      include: { proveedor: true },
      orderBy: { puntajeTotal: 'desc' },
    });
  }

  async generarFacturaPdf(id: number, res: Response) {
    const factura = await this.getFactura(id);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${factura.numero}.pdf`);
    doc.pipe(res);

    doc.fillColor('#1B263B').fontSize(18).text('FACTURA PROVEEDOR', { align: 'center' }).moveDown();
    doc.fontSize(11).fillColor('#444444')
      .text(`Numero: ${factura.numero}`)
      .text(`Proveedor: ${factura.proveedor.razonSocial}`)
      .text(`OC: ${factura.ordenCompra?.numero || 'N/A'}`)
      .text(`Estado cruce: ${factura.estadoCruce}`)
      .text(`Estado pago: ${factura.estadoPago}`)
      .moveDown();

    doc.fillColor('#1B263B').fontSize(12).text('Detalle').moveDown(0.5);
    factura.detalles.forEach((d) => {
      doc.fillColor('#444444').fontSize(10)
        .text(`${d.descripcion} | Cant: ${d.cantidad} | PU: S/ ${Number(d.precioUnitario).toFixed(2)} | Subtotal: S/ ${Number(d.subtotal).toFixed(2)}`);
    });

    doc.moveDown().fontSize(11)
      .text(`Subtotal: S/ ${Number(factura.monto).toFixed(2)}`, { align: 'right' })
      .text(`IGV: S/ ${Number(factura.igv).toFixed(2)}`, { align: 'right' })
      .text(`Total: S/ ${Number(factura.total).toFixed(2)}`, { align: 'right' });

    if (factura.observacionesCruce) {
      doc.moveDown().fillColor('#991B1B').text(`Observaciones: ${factura.observacionesCruce}`);
    }

    doc.end();
  }

  private calcularCruce(orden: any, detallesFactura: any[], subtotal: number, igv: number, total: number) {
    const recibidoPorProducto = new Map<string, number>();
    orden.recepciones.forEach((recepcion) => {
      recepcion.detalles.forEach((detalle) => {
        const key = detalle.productoId ? `p:${detalle.productoId}` : `d:${detalle.descripcion.toLowerCase()}`;
        recibidoPorProducto.set(key, (recibidoPorProducto.get(key) || 0) + Number(detalle.cantidadRecibida));
      });
    });

    const discrepancias: string[] = [];
    const guias = orden.recepciones.flatMap((recepcion) => recepcion.guias.map((guia) => guia.numero));

    if (guias.length === 0) {
      discrepancias.push('La orden no tiene guia de remision registrada');
    }

    if (Math.abs(Number(orden.subtotal) - subtotal) > 0.05) {
      discrepancias.push(`Subtotal factura S/ ${subtotal.toFixed(2)} no coincide con OC S/ ${Number(orden.subtotal).toFixed(2)}`);
    }

    if (Math.abs(Number(orden.igv) - igv) > 0.05) {
      discrepancias.push(`IGV factura S/ ${igv.toFixed(2)} no coincide con OC S/ ${Number(orden.igv).toFixed(2)}`);
    }

    if (Math.abs(Number(orden.montoTotal) - total) > 0.05) {
      discrepancias.push(`Total factura S/ ${total.toFixed(2)} no coincide con OC S/ ${Number(orden.montoTotal).toFixed(2)}`);
    }

    detallesFactura.forEach((item) => {
      const key = item.productoId ? `p:${item.productoId}` : `d:${item.descripcion.toLowerCase()}`;
      const recibido = recibidoPorProducto.get(key) || 0;
      if (recibido < Number(item.cantidad)) {
        discrepancias.push(`${item.descripcion}: factura ${item.cantidad}, recibido ${recibido}`);
      }
    });

    return {
      conforme: discrepancias.length === 0,
      discrepancias,
      guias,
      totales: {
        ordenCompra: Number(orden.montoTotal),
        factura: total,
        subtotalFactura: subtotal,
        igvFactura: igv,
      },
    };
  }

  private async actualizarDesempenoProveedor(proveedorId: number) {
    const [ordenes, facturas, incidencias, ofertas] = await Promise.all([
      this.prisma.ordenCompra.findMany({ where: { proveedorId }, include: { recepciones: { include: { detalles: true } } } }),
      this.prisma.factura.findMany({ where: { proveedorId } }),
      this.prisma.incidenciaProveedor.findMany({ where: { proveedorId } }),
      this.prisma.ofertaProveedor.findMany({ where: { proveedorId } }),
    ]);

    const transacciones = Math.max(ordenes.length, facturas.length);
    const entregasConformes = ordenes.filter((orden) =>
      orden.recepciones.some((recepcion) => recepcion.detalles.every((d) => d.estado === 'CONFORME')),
    ).length;
    const impacto = incidencias.reduce((sum, item) => sum + item.impacto, 0);
    const puntajeCumplimiento = Math.max(0, Math.min(100, transacciones === 0 ? 100 : (entregasConformes / transacciones) * 100 - impacto * 5));
    const precioPromedio = ofertas.length ? ofertas.reduce((sum, item) => sum + Number(item.puntajePrecio || 80), 0) / ofertas.length : 80;
    const puntajeTotal = Math.max(0, Math.min(100, puntajeCumplimiento * 0.65 + precioPromedio * 0.35));

    return this.prisma.desempenoProveedor.upsert({
      where: { proveedorId },
      update: {
        transacciones,
        entregasConformes,
        incidencias: incidencias.length,
        puntajeCumplimiento,
        puntajePrecio: precioPromedio,
        puntajeTotal,
        ultimaTransaccion: new Date(),
      },
      create: {
        proveedorId,
        transacciones,
        entregasConformes,
        incidencias: incidencias.length,
        puntajeCumplimiento,
        puntajePrecio: precioPromedio,
        puntajeTotal,
        ultimaTransaccion: new Date(),
      },
    });
  }

  private async recalcularTodosDesempenos() {
    const proveedores = await this.prisma.proveedor.findMany({ select: { id: true } });
    for (const proveedor of proveedores) {
      await this.actualizarDesempenoProveedor(proveedor.id);
    }
  }
}
