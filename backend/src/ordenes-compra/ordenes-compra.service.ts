import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerarOrdenDto } from './dto/generar-orden.dto';
import { AprobarOrdenDto } from './dto/aprobar-orden.dto';
import { SolicitarRevisionDto } from './dto/solicitar-revision.dto';
import { RechazarOrdenDto } from './dto/rechazar-orden.dto';
import { EstadoOrdenCompra, EstadoSolicitudCotizacion, Rol } from '@prisma/client';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class OrdenesCompraService {
  constructor(private prisma: PrismaService) {}

  // ─── Helper: Generar número correlativo (usa tx si está disponible) ───────────
  private async generarNumeroOC(tx?: any): Promise<string> {
    const year = new Date().getFullYear();
    const prisma = tx || this.prisma;
    
    const ultimo = await prisma.ordenCompra.findFirst({
      where: { numero: { startsWith: `OC-${year}-` } },
      orderBy: { numero: 'desc' },
    });
    
    const siguiente = ultimo ? parseInt(ultimo.numero.split('-')[2], 10) + 1 : 1;
    return `OC-${year}-${String(siguiente).padStart(4, '0')}`;
  }

  // ─── Helper: Registrar historial ─────────────────────────────────────────────
  private async registrarHistorial(
    ordenId: number,
    estadoAnterior: EstadoOrdenCompra | null,
    estadoNuevo: EstadoOrdenCompra,
    usuarioId: number | null,
    observaciones?: string
  ) {
    return this.prisma.historialOrdenCompra.create({
      data: {
        ordenCompraId: ordenId,
        estadoAnterior,
        estadoNuevo,
        usuarioId,
        observaciones,
      },
    });
  }

  // ─── Helper: Enviar notificaciones reales ────────────────────────────────────────
  private async enviarNotificaciones(ordenId: number, tipo: string, userId: number | null = null) {
    const orden = await this.findOne(ordenId);
    let titulo = '';
    let mensaje = '';
    let receptores: number[] = [];

    // Buscar usuario proveedor en todos los casos
    const usuarioProveedor = await this.prisma.usuario.findFirst({
      where: { email: orden.proveedor.email }
    });
    const analistaId = orden.solicitudCotizacion?.analistaId;

    switch (tipo) {
      case 'aprobada':
        titulo = 'Orden de Compra Aprobada';
        mensaje = `La orden ${orden.numero} ha sido aprobada.`;
        if (usuarioProveedor) receptores.push(usuarioProveedor.id);
        if (analistaId) receptores.push(analistaId);
        break;
      case 'revision':
        titulo = 'Orden de Compra en Revisión';
        mensaje = `Se ha solicitado revisión para la orden ${orden.numero}: ${orden.justificacionRevision}`;
        if (analistaId) receptores.push(analistaId);
        break;
      case 'rechazada':
        titulo = 'Orden de Compra Rechazada';
        mensaje = `La orden ${orden.numero} ha sido rechazada: ${orden.justificacionRechazo}`;
        if (usuarioProveedor) receptores.push(usuarioProveedor.id);
        if (analistaId) receptores.push(analistaId);
        break;
    }

    // Crear notificaciones
    for (const receptorId of receptores) {
      await this.prisma.notificacion.create({
        data: {
          emisorId: userId,
          receptorId,
          titulo,
          mensaje,
          leida: false,
          ordenCompraId: ordenId,
        }
      });
    }
  }

  // ─── Generar PDF ────────────────────────────────────────────────────────
  async generatePdf(id: number, res: Response) {
    const orden = await this.findOne(id);
    
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    });

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${orden.numero}.pdf`);

    // Pipe to response
    doc.pipe(res);

    // Header
    doc
      .fillColor('#1B263B')
      .fontSize(20)
      .text('SISTEMA DE GESTIÓN DE COMPRAS (SGCA)', { align: 'center' })
      .moveDown();

    doc
      .fontSize(16)
      .text(`ORDEN DE COMPRA: ${orden.numero}`, { align: 'center' })
      .moveDown();

    doc
      .fontSize(10)
      .fillColor('#444444')
      .text(`Fecha de Emisión: ${new Date(orden.fechaEmision).toLocaleDateString('es-PE')}`, { align: 'left' })
      .text(`Fecha de Entrega Estimada: ${orden.fechaEntregaEsperada ? new Date(orden.fechaEntregaEsperada).toLocaleDateString('es-PE') : 'N/A'}`)
      .moveDown();

    // Proveedor
    doc
      .fillColor('#1B263B')
      .fontSize(12)
      .text('DATOS DEL PROVEEDOR', { underline: true })
      .moveDown(0.5);
    doc
      .fillColor('#444444')
      .fontSize(10)
      .text(`Razón Social: ${orden.proveedor.razonSocial}`)
      .text(`RUC: ${orden.proveedor.ruc}`)
      .text(`Teléfono: ${orden.proveedor.telefono || 'N/A'}`)
      .text(`Email: ${orden.proveedor.email || 'N/A'}`)
      .moveDown();

    // Detalles
    doc
      .fillColor('#1B263B')
      .fontSize(12)
      .text('DETALLE DE PRODUCTOS', { underline: true })
      .moveDown(0.5);

    // Table headers
    const tableTop = doc.y;
    doc
      .fillColor('#006D77')
      .rect(50, tableTop, 500, 25)
      .fill();
    doc
      .fillColor('white')
      .fontSize(10)
      .text('Descripción', 55, tableTop + 7)
      .text('Cantidad', 300, tableTop + 7)
      .text('Precio Unitario', 380, tableTop + 7)
      .text('Subtotal', 470, tableTop + 7);

    let y = tableTop + 30;
    doc.fillColor('#444444');
    orden.detalles.forEach(detalle => {
      doc
        .fontSize(10)
        .text(detalle.descripcion, 55, y)
        .text(detalle.cantidad.toString(), 300, y)
        .text(`S/ ${Number(detalle.precioUnitario).toFixed(2)}`, 380, y)
        .text(`S/ ${Number(detalle.subtotal).toFixed(2)}`, 470, y);
      y += 20;
    });

    // Totales
    y += 20;
    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
    y += 10;
    doc
      .fontSize(10)
      .text('Subtotal:', 400, y, { align: 'right' })
      .text(`S/ ${Number(orden.subtotal).toFixed(2)}`, 470, y);
    y += 15;
    doc
      .text('IGV (18%):', 400, y, { align: 'right' })
      .text(`S/ ${Number(orden.igv).toFixed(2)}`, 470, y);
    y += 15;
    doc
      .fontSize(12)
      .text('TOTAL:', 400, y, { align: 'right' })
      .text(`S/ ${Number(orden.montoTotal).toFixed(2)}`, 470, y);

    // Footer
    const footerY = doc.page.height - 100;
    doc
      .fillColor('#888888')
      .fontSize(8)
      .text('SGCA - Sistema de Gestión de Compras - UNT Ingeniería de Sistemas', 50, footerY, {
        align: 'center',
      });

    // Finalize the PDF and end the stream
    doc.end();
  }

  // ─── Generar Orden de Compra (desde solicitud adjudicada ───────────────────────
  async generarOrden(dto: GenerarOrdenDto, analistaId: number) {
    // 1. Buscar la solicitud de cotización
    const solicitud = await this.prisma.solicitudCotizacion.findUnique({
      where: { id: dto.solicitudCotizacionId },
      include: {
        requerimiento: { include: { detalles: { include: { producto: true } } } },
        ofertas: true,
        proveedorGanador: true,
        items: true,
      },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud de cotización no encontrada');
    }

    // 2. Verificar que esté adjudicada
    if (solicitud.estado !== EstadoSolicitudCotizacion.ADJUDICADA) {
      throw new BadRequestException('Solo se puede generar OC de solicitudes ADJUDICADAS');
    }

    if (!solicitud.proveedorGanadorId) {
      throw new BadRequestException('La solicitud no tiene un proveedor ganador');
    }

    // 3. Buscar la oferta ganadora
    const ofertaGanadora = await this.prisma.ofertaProveedor.findFirst({
      where: {
        solicitudCotizacionId: solicitud.id,
        proveedorId: solicitud.proveedorGanadorId,
      },
    });

    if (!ofertaGanadora) {
      throw new NotFoundException('Oferta ganadora no encontrada');
    }

    // 4. Verificar que no exista OC previa
    const ocExistente = await this.prisma.ordenCompra.findFirst({
      where: { solicitudCotizacionId: solicitud.id },
    });

    if (ocExistente) {
      throw new BadRequestException('Ya existe una Orden de Compra para esta solicitud');
    }

    // 5. Calcular montos (IGV 18%)
    const subtotal = Number(ofertaGanadora.montoTotal);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Calcular precio unitario y subtotal por item
    const numItems = solicitud.items.length;
    const precioUnitarioPorItem = numItems > 0 ? subtotal / numItems : 0;
    const subtotalPorItem = numItems > 0 ? subtotal / numItems : 0;

    // 6. Generar la OC en transacción
    let ordenId: number;
    await this.prisma.$transaction(async (tx) => {
      const numeroOC = await this.generarNumeroOC(tx);

      const orden = await tx.ordenCompra.create({
        data: {
          numero: numeroOC,
          solicitudCotizacionId: solicitud.id,
          ofertaGanadoraId: ofertaGanadora.id,
          proveedorId: solicitud.proveedorGanadorId,
          estado: EstadoOrdenCompra.PENDIENTE_APROBACION,
          subtotal: subtotal,
          igv: igv,
          montoTotal: total,
          fechaEntregaEsperada: new Date(Date.now() + ofertaGanadora.plazoEntregaDias * 24 * 60 * 60 * 1000),
          condicionesComerciales: ofertaGanadora.condicionesPago,
          detalles: {
            create: solicitud.items.map((item) => {
              // Intentar asociar a producto si existe
              let detalleRequerimiento = null;
              if (solicitud.requerimiento && solicitud.requerimiento.detalles) {
                detalleRequerimiento = solicitud.requerimiento.detalles.find(d => 
                  d.producto && d.producto.nombre.includes(item.descripcion)
                );
              }
              
              return {
                productoId: detalleRequerimiento?.productoId || null,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                precioUnitario: precioUnitarioPorItem,
                subtotal: subtotalPorItem,
              };
            }),
          },
        },
      });
      ordenId = orden.id;

      // 7. Registrar en historial
      await tx.historialOrdenCompra.create({
        data: {
          ordenCompraId: orden.id,
          estadoAnterior: null,
          estadoNuevo: orden.estado,
          usuarioId: analistaId,
          observaciones: 'Orden generada',
        },
      });
    });

    // Return full OrdenCompra object with all includes
    return this.findOne(ordenId);
  }

  // ─── Listar órdenes (por rol) ────────────────────────────────────────────
  async findAll(userRol: string, userId: number) {
    const where: any = {};

    if (userRol === Rol.PROVEEDOR) {
      // Proveedor ve solo sus órdenes
      const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
      const proveedor = await this.prisma.proveedor.findFirst({
        where: { email: usuario?.email } });
      if (proveedor) {
        where.proveedorId = proveedor.id;
      } else {
        return [];
      }
    }

    return this.prisma.ordenCompra.findMany({
      where,
      include: {
        proveedor: true,
        solicitudCotizacion: { include: { requerimiento: true } },
        detalles: true,
        gerenteAprobador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Obtener detalle de una orden ─────────────────────────────────────────
  async findOne(id: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        solicitudCotizacion: {
          include: {
            requerimiento: { include: { detalles: { include: { producto: true } } } },
            ofertas: { include: { proveedor: true } },
            items: true,
          },
        },
        ofertaGanadora: { include: { proveedor: true } },
        detalles: true,
        historial: { 
          include: { usuario: { select: { id: true, nombre: true, apellido: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException('Orden de Compra no encontrada');
    }

    return orden;
  }

  // ─── Aprobar OC (Gerente) ────────────────────────────────────────────────
  async aprobar(id: number, dto: AprobarOrdenDto, gerenteId: number) {
    const orden = await this.findOne(id);

    if (orden.estado !== EstadoOrdenCompra.PENDIENTE_APROBACION &&
        orden.estado !== EstadoOrdenCompra.EN_REVISION) {
      throw new BadRequestException('Solo se puede aprobar órdenes pendientes o en revisión');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ordenCompra.update({
        where: { id },
        data: {
          estado: EstadoOrdenCompra.APROBADA,
          gerenteAprobadorId: gerenteId,
          fechaAprobacion: new Date(),
        },
      });

      await this.registrarHistorial(
        id,
        orden.estado,
        EstadoOrdenCompra.APROBADA,
        gerenteId,
        dto.observaciones
      );

      await this.enviarNotificaciones(id, 'aprobada');
    });

    // Return the full updated OrdenCompra object with all includes!
    return this.findOne(id);
  }

  // ─── Solicitar revisión (Gerente) ───────────────────────────────────────────
  async solicitarRevision(id: number, dto: SolicitarRevisionDto, gerenteId: number) {
    const orden = await this.findOne(id);

    if (orden.estado !== EstadoOrdenCompra.PENDIENTE_APROBACION) {
      throw new BadRequestException('Solo se puede solicitar revisión de órdenes pendientes');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ordenCompra.update({
        where: { id },
        data: {
          estado: EstadoOrdenCompra.EN_REVISION,
          justificacionRevision: dto.justificacion,
        },
      });

      await this.registrarHistorial(
        id,
        orden.estado,
        EstadoOrdenCompra.EN_REVISION,
        gerenteId,
        dto.justificacion
      );

      await this.enviarNotificaciones(id, 'revision');
    });

    return this.findOne(id);
  }

  // ─── Rechazar OC (Gerente) ───────────────────────────────────────────────
  async rechazar(id: number, dto: RechazarOrdenDto, gerenteId: number) {
    const orden = await this.findOne(id);

    if (orden.estado !== EstadoOrdenCompra.PENDIENTE_APROBACION &&
        orden.estado !== EstadoOrdenCompra.EN_REVISION) {
      throw new BadRequestException('Solo se puede rechazar órdenes pendientes o en revisión');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ordenCompra.update({
        where: { id },
        data: {
          estado: EstadoOrdenCompra.RECHAZADA,
          justificacionRechazo: dto.justificacion,
        },
      });

      await this.registrarHistorial(
        id,
        orden.estado,
        EstadoOrdenCompra.RECHAZADA,
        gerenteId,
        dto.justificacion
      );

      await this.enviarNotificaciones(id, 'rechazada');
    });

    return this.findOne(id);
  }

  // ─── Obtener órdenes pendientes de recepción (Almacén) ───────────────────
  async getPendientesRecepcion() {
    return this.prisma.ordenCompra.findMany({
      where: {
        estado: {
          in: [EstadoOrdenCompra.APROBADA, EstadoOrdenCompra.ENVIADA_PROVEEDOR, EstadoOrdenCompra.EN_RECEPCION, EstadoOrdenCompra.RECEPCION_PARCIAL],
        },
      },
      include: {
        proveedor: true,
        detalles: true,
        solicitudCotizacion: { include: { requerimiento: true } },
      },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  // ─── Obtener expediente digital (para Gerente) ───────────────────────────────
  async getExpediente(id: number) {
    const orden = await this.findOne(id);
    return {
      orden,
      expediente: {
        requerimiento: orden.solicitudCotizacion?.requerimiento,
        solicitudCotizacion: orden.solicitudCotizacion,
        ofertas: orden.solicitudCotizacion?.ofertas,
        proveedorSeleccionado: orden.proveedor,
      },
    };
  }
}
