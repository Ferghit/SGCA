import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoRequerimiento } from '@prisma/client';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';
import {
  A4_PRINT_LAYOUT,
  createA4PdfDocument,
  drawPdfFooter,
  setPdfDownloadHeaders,
} from '../common/pdf/pdf-layout';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  private formatDateOnly(dateValue: Date | string): string {
    const isoString = dateValue instanceof Date ? dateValue.toISOString() : String(dateValue);
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoString);

    if (match) {
      const [, year, month, day] = match;
      const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
      return utcDate.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    }

    return new Date(dateValue).toLocaleDateString('es-PE');
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDIENTE_APROBACION': 'Pendiente Aprobación',
      'EN_REVISION': 'En Revisión',
      'APROBADA': 'Aprobada',
      'RECHAZADA': 'Rechazada',
      'ENVIADA_PROVEEDOR': 'Enviada a Proveedor',
      'EN_RECEPCION': 'En Recepción',
      'RECEPCION_PARCIAL': 'Recepción Parcial',
      'RECEPCION_COMPLETA': 'Recepción Completa',
      'CERRADA': 'Cerrada',
      'CANCELADA': 'Cancelada',
      'BORRADOR': 'Borrador',
      'PENDIENTE': 'Pendiente',
      'APROBADO': 'Aprobado por Jefatura',
      'APROBADO_GERENTE': 'Aprobado por Gerencia',
      'RECHAZADO': 'Rechazado'
    };
    return statusMap[status] || status;
  }

  async getKPIs(fechaInicio?: string, fechaFin?: string) {
    const whereDates: any = {};
    if (fechaInicio) {
      whereDates.createdAt = { ...whereDates.createdAt, gte: new Date(fechaInicio) };
    }
    if (fechaFin) {
      whereDates.createdAt = { ...whereDates.createdAt, lte: new Date(fechaFin) };
    }

    const [pendientes, aprobados, rechazados] = await Promise.all([
      this.prisma.requerimiento.count({ where: { ...whereDates, estado: EstadoRequerimiento.PENDIENTE } }),
        this.prisma.requerimiento.count({ where: { ...whereDates, estado: EstadoRequerimiento.APROBADO_GERENTE } }),
      this.prisma.requerimiento.count({ where: { ...whereDates, estado: EstadoRequerimiento.RECHAZADO } }),
    ]);

    const requerimientosAprobados = await this.prisma.requerimiento.findMany({
      where: { ...whereDates, estado: EstadoRequerimiento.APROBADO_GERENTE },
      include: { historial: { orderBy: { createdAt: 'asc' } } }
    });

    let promedioAprobacion = 0;
    if (requerimientosAprobados.length > 0) {
      const totalDias = requerimientosAprobados.reduce((sum, req) => {
        const primerHistorial = req.historial[0];
        const aprobacionHistorial = req.historial.find(h => h.estadoNuevo === EstadoRequerimiento.APROBADO_GERENTE);
        if (primerHistorial && aprobacionHistorial) {
          const diffMs = aprobacionHistorial.createdAt.getTime() - primerHistorial.createdAt.getTime();
          const diffDias = diffMs / (1000 * 60 * 60 * 24);
          return sum + diffDias;
        }
        return sum;
      }, 0);
      promedioAprobacion = totalDias / requerimientosAprobados.length;
    }

    const rankingProveedores = (await this.getReporteProveedores()).slice(0, 10);

    const whereOC: any = {};
    if (fechaInicio) whereOC.createdAt = { ...whereOC.createdAt, gte: new Date(fechaInicio) };
    if (fechaFin) whereOC.createdAt = { ...whereOC.createdAt, lte: new Date(fechaFin) };
    const montoCompras = await this.prisma.ordenCompra.aggregate({
      where: whereOC,
      _sum: { montoTotal: true },
    });

    return {
      requerimientos: { pendientes, aprobados, rechazados },
      tiempoPromedioAprobacion: promedioAprobacion.toFixed(2),
      rankingProveedores,
      montoTotalCompras: montoCompras._sum.montoTotal || 0,
    };
  }

  async getReporteCompras(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio) where.createdAt = { ...where.createdAt, gte: new Date(fechaInicio) };
    if (fechaFin) where.createdAt = { ...where.createdAt, lte: new Date(fechaFin) };

    return this.prisma.ordenCompra.findMany({
      where,
      include: { proveedor: true, solicitudCotizacion: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReporteProveedores() {
    await this.recalcularDesempenoProveedores();

    return this.prisma.desempenoProveedor.findMany({
      include: { proveedor: true },
      orderBy: { puntajeTotal: 'desc' },
    });
  }

  private async recalcularDesempenoProveedores() {
    const proveedores = await this.prisma.proveedor.findMany({
      select: { id: true },
    });

    for (const proveedor of proveedores) {
      await this.actualizarDesempenoProveedor(proveedor.id);
    }
  }

  private async actualizarDesempenoProveedor(proveedorId: number) {
    const [ordenes, facturas, incidencias, ofertas] = await Promise.all([
      this.prisma.ordenCompra.findMany({
        where: { proveedorId },
        include: { recepciones: { include: { detalles: true } } },
      }),
      this.prisma.factura.findMany({ where: { proveedorId } }),
      this.prisma.incidenciaProveedor.findMany({ where: { proveedorId } }),
      this.prisma.ofertaProveedor.findMany({ where: { proveedorId } }),
    ]);

    const transacciones = Math.max(ordenes.length, facturas.length);
    const entregasConformes = ordenes.filter((orden) =>
      orden.recepciones.some((recepcion) =>
        recepcion.detalles.length === 0 || recepcion.detalles.every((detalle) => detalle.estado === 'CONFORME'),
      ),
    ).length;
    const impactoIncidencias = incidencias.reduce((sum, item) => sum + item.impacto, 0);
    const puntajeCumplimiento = Math.max(
      0,
      Math.min(100, transacciones === 0 ? 100 : (entregasConformes / transacciones) * 100 - impactoIncidencias * 5),
    );
    const ofertasConPrecio = ofertas.filter((oferta) => oferta.puntajePrecio !== null);
    const puntajePrecio = ofertasConPrecio.length
      ? ofertasConPrecio.reduce((sum, item) => sum + Number(item.puntajePrecio), 0) / ofertasConPrecio.length
      : 80;
    const puntajeTotal = Math.max(0, Math.min(100, puntajeCumplimiento * 0.65 + puntajePrecio * 0.35));

    return this.prisma.desempenoProveedor.upsert({
      where: { proveedorId },
      update: {
        transacciones,
        entregasConformes,
        incidencias: incidencias.length,
        puntajeCumplimiento,
        puntajePrecio,
        puntajeTotal,
        ultimaTransaccion: transacciones > 0 ? new Date() : null,
      },
      create: {
        proveedorId,
        transacciones,
        entregasConformes,
        incidencias: incidencias.length,
        puntajeCumplimiento,
        puntajePrecio,
        puntajeTotal,
        ultimaTransaccion: transacciones > 0 ? new Date() : null,
      },
    });
  }

  async getProductosRotacion(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio) where.createdAt = { ...where.createdAt, gte: new Date(fechaInicio) };
    if (fechaFin) where.createdAt = { ...where.createdAt, lte: new Date(fechaFin) };

    const detalles = await this.prisma.ordenCompraDetalle.findMany({
      where: { ordenCompra: where },
      include: { producto: true },
    });

    const rotacionMap = new Map<number, { producto: any, cantidad: number }>();

    for (const detalle of detalles) {
      if (detalle.productoId) {
        const existing = rotacionMap.get(detalle.productoId);
        if (existing) {
          existing.cantidad += Number(detalle.cantidad);
        } else {
          rotacionMap.set(detalle.productoId, {
            producto: detalle.producto,
            cantidad: Number(detalle.cantidad),
          });
        }
      }
    }

    return Array.from(rotacionMap.values()).sort((a, b) => b.cantidad - a.cantidad);
  }

  async getStockCritico() {
    return this.prisma.inventario.findMany({
      include: { producto: true },
      where: {
        cantidad: { lte: this.prisma.inventario.fields.stockMinimo },
      },
      orderBy: { cantidad: 'asc' },
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
    doc
      .rect(50, 50, 495, 100)
      .fillAndStroke('#006D77', '#004D55');
    
    doc
      .fillColor('#FFFFFF')
      .fontSize(18)
      .text('Sistema de Gestión', 50, 70, { align: 'center' })
      .fontSize(20)
      .text('Compras y Aprovisionamiento', 50, 92, { align: 'center' });
      
    doc
      .fillColor('#1B263B')
      .fontSize(16)
      .text(title, 50, 170, { align: 'center' });
      
    if (subtitle) {
      doc
        .fontSize(12)
        .text(subtitle, 50, 195, { align: 'center' });
    }
    
    doc
      .strokeColor('#006D77')
      .lineWidth(1)
      .moveTo(50, subtitle ? 210 : 185)
      .lineTo(545, subtitle ? 210 : 185)
      .stroke();
  }

  private addFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number, genDate: string) {
    drawPdfFooter(doc, `Generado: ${genDate}`, `Pagina ${pageNum} de ${totalPages}`);
    return;
    /*

    doc
      .strokeColor('#E9ECEF')
      .lineWidth(1)
      .moveTo(50, doc.page.height - 50)
      .lineTo(545, doc.page.height - 50)
      .stroke();
    
    doc
      .fillColor('#6C757D')
      .fontSize(9)
      .text(`Generado: ${genDate}`, 50, doc.page.height - 40, { align: 'left' })
      .text(`Página ${pageNum} de ${totalPages}`, 50, doc.page.height - 40, { align: 'right', width: 495 });
    */
  }

  private drawTableHeader(doc: PDFKit.PDFDocument, y: number, headers: string[], columnWidths: number[]) {
    const headerHeight = 30;
    doc
      .rect(50, y, columnWidths.reduce((a, b) => a + b, 0), headerHeight)
      .fillAndStroke('#F0F7F8', '#006D77');
      
    let currentX = 50;
    headers.forEach((header, i) => {
      doc
        .fillColor('#006D77')
        .fontSize(10)
        .text(header, currentX, y + 9, {
          width: columnWidths[i],
          height: headerHeight - 12,
          align: i === headers.length - 1 ? 'right' : 'left',
          ellipsis: true,
        });
      currentX += columnWidths[i];
    });
    
    return y + headerHeight;
  }

  private drawTableRow(doc: PDFKit.PDFDocument, y: number, row: any[], columnWidths: number[], isEven: boolean) {
    const rowHeight = 25;
    if (isEven) {
      doc
        .rect(50, y, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
        .fill('#F8F9FA');
    }
    doc
      .strokeColor('#E9ECEF')
      .lineWidth(0.5)
      .rect(50, y, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
      .stroke();
    
    let currentX = 50;
    row.forEach((cell, i) => {
      doc
        .fillColor('#333333')
        .fontSize(10)
        .text(cell || '-', currentX, y + 7, { 
          width: columnWidths[i], 
          height: rowHeight - 10,
          align: i === row.length - 1 ? 'right' : 'left',
          ellipsis: true 
        });
      currentX += columnWidths[i];
    });
    return y + rowHeight;
  }

  private createPDFBuffer(
    renderFn: (doc: PDFKit.PDFDocument) => void
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = createA4PdfDocument();
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      renderFn(doc);
      
      doc.end();
    });
  }

  private createTableWithPagination(
    doc: PDFKit.PDFDocument,
    title: string,
    subtitle: string | undefined,
    headers: string[],
    columnWidths: number[],
    rows: any[][],
    genDate: string,
    afterTableCallback?: (doc: PDFKit.PDFDocument, y: number) => number,
    afterTableReservedHeight = 0
  ) {
    const pageMaxY = A4_PRINT_LAYOUT.contentBottomY;
    const headerHeight = 30;
    const rowHeight = 25;
    const tableHeaderStartY = subtitle ? 210 : 185;
    
    // First pass: CALCULATE total pages WITHOUT DRAWING ANYTHING!
    let testPages = 1;
    let testY = tableHeaderStartY + headerHeight; // After table header
    
    for (const [] of rows.entries()) {
      if (testY + rowHeight > pageMaxY) {
        testPages++;
        testY = tableHeaderStartY + headerHeight; // Reset to after new page's table header
      }
      testY += rowHeight;
    }

    if (afterTableReservedHeight > 0 && testY + afterTableReservedHeight > pageMaxY) {
      testPages++;
    }
    
    const totalPages = testPages;
    let currentPage = 1;
    
    // Now DRAW everything for real!
    this.addHeader(doc, title, subtitle);
    let currentY = tableHeaderStartY;
    currentY = this.drawTableHeader(doc, currentY, headers, columnWidths);
    
    for (const [index, row] of rows.entries()) {
      if (currentY + rowHeight > pageMaxY) {
        // Add footer to current page
        this.addFooter(doc, currentPage, totalPages, genDate);
        // New page
        doc.addPage();
        currentPage++;
        // Draw header and table header on new page
        this.addHeader(doc, title, subtitle);
        currentY = tableHeaderStartY;
        currentY = this.drawTableHeader(doc, currentY, headers, columnWidths);
      }
      
      currentY = this.drawTableRow(doc, currentY, row, columnWidths, index % 2 === 0);
    }
    
    // After table, run callback if any
    if (afterTableCallback) {
      if (afterTableReservedHeight > 0 && currentY + afterTableReservedHeight > pageMaxY) {
        this.addFooter(doc, currentPage, totalPages, genDate);
        doc.addPage();
        currentPage++;
        this.addHeader(doc, title, subtitle);
        currentY = tableHeaderStartY;
      }

      currentY = afterTableCallback(doc, currentY);
    }
    
    // Add footer to final page
    this.addFooter(doc, currentPage, totalPages, genDate);
  }

  async generateComprasPDF(res: Response, fechaInicio?: string, fechaFin?: string): Promise<void> {
    const compras = await this.getReporteCompras(fechaInicio, fechaFin);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const subtitle = fechaInicio || fechaFin ? `Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}` : undefined;
    const headers = ['N° Orden', 'Proveedor', 'Fecha Emisión', 'Monto Total', 'Estado'];
    const columnWidths = [90, 160, 90, 90, 65];
    const rows = compras.map(oc => [
      oc.numero,
      oc.proveedor?.razonSocial || '-',
      new Date(oc.createdAt).toLocaleDateString('es-PE'),
      `S/ ${Number(oc.montoTotal).toFixed(2)}`,
      this.formatStatus(oc.estado)
    ]);
    const total = compras.reduce((sum, oc) => sum + Number(oc.montoTotal), 0);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Compras',
        subtitle,
        headers,
        columnWidths,
        rows,
        formattedDate,
        (d, y) => {
          d
            .fillColor('#1B263B')
            .fontSize(12)
            .rect(50, y, 495, 30)
            .fillAndStroke('#E8F4F5', '#006D77')
            .fillColor('#006D77')
            .text(`Total General: S/ ${total.toFixed(2)}`, 50, y + 10, {
              width: 495,
              height: 14,
              align: 'right',
              lineBreak: false,
            });
          return y + 30;
        },
        30
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-compras.pdf', buffer.length);
    res.send(buffer);
  }

  async generateProveedoresPDF(res: Response): Promise<void> {
    const proveedores = await this.getReporteProveedores();
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const headers = ['Proveedor', 'Transacciones', 'Entregas Conformes', 'Incidencias', 'Puntaje Total'];
    const columnWidths = [180, 80, 100, 70, 65];
    const rows = proveedores.map(prov => [
      prov.proveedor?.razonSocial || '-',
      String(prov.transacciones),
      String(prov.entregasConformes),
      String(prov.incidencias),
      `${prov.puntajeTotal} pts`
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Desempeño de Proveedores',
        undefined,
        headers,
        columnWidths,
        rows,
        formattedDate
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-proveedores.pdf', buffer.length);
    res.send(buffer);
  }

  async generateStockCriticoPDF(res: Response): Promise<void> {
    const stock = await this.getStockCritico();
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const headers = ['Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo'];
    const columnWidths = [180, 120, 90, 105];
    const rows = stock.map(item => [
      item.producto.nombre,
      item.producto.categoria || '-',
      String(item.cantidad),
      String(item.stockMinimo)
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      if (stock.length === 0) {
        this.addHeader(doc, 'Reporte de Stock Crítico');
        doc.fontSize(12).text('No hay productos con stock crítico.', { align: 'center' });
        this.addFooter(doc, 1, 1, formattedDate);
      } else {
        this.createTableWithPagination(
          doc,
          'Reporte de Stock Crítico',
          undefined,
          headers,
          columnWidths,
          rows,
          formattedDate
        );
      }
    });
    
    setPdfDownloadHeaders(res, 'reporte-stock-critico.pdf', buffer.length);
    res.send(buffer);
  }

  async getOperativoUsuarios() {
    return this.prisma.usuario.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getOperativoProductos() {
    return this.prisma.producto.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getOperativoRequerimientos(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio) where.createdAt = { ...where.createdAt, gte: new Date(fechaInicio) };
    if (fechaFin) where.createdAt = { ...where.createdAt, lte: new Date(fechaFin) };
    return this.prisma.requerimiento.findMany({
      where,
      include: { solicitante: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOperativoSolicitudesCotizacion(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio) where.createdAt = { ...where.createdAt, gte: new Date(fechaInicio) };
    if (fechaFin) where.createdAt = { ...where.createdAt, lte: new Date(fechaFin) };
    return this.prisma.solicitudCotizacion.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOperativoOrdenesCompra(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio) where.createdAt = { ...where.createdAt, gte: new Date(fechaInicio) };
    if (fechaFin) where.createdAt = { ...where.createdAt, lte: new Date(fechaFin) };
    return this.prisma.ordenCompra.findMany({
      where,
      include: { proveedor: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOperativoRecepciones(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio) where.fechaRecepcion = { ...where.fechaRecepcion, gte: new Date(fechaInicio) };
    if (fechaFin) where.fechaRecepcion = { ...where.fechaRecepcion, lte: new Date(fechaFin) };
    return this.prisma.recepcion.findMany({
      where,
      include: { ordenCompra: true },
      orderBy: { fechaRecepcion: 'desc' }
    });
  }

  async getOperativoInventario() {
    return this.prisma.inventario.findMany({
      include: { producto: true },
      orderBy: { cantidad: 'asc' }
    });
  }

  async generateOperativoUsuariosPDF(res: Response) {
    const data = await this.getOperativoUsuarios();
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const headers = ['Nombre', 'Apellido', 'Email', 'Rol'];
    const columnWidths = [130, 130, 180, 55];
    const rows = data.map(item => [
      item.nombre,
      item.apellido,
      item.email,
      item.rol
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Usuarios',
        undefined,
        headers,
        columnWidths,
        rows,
        formattedDate
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-usuarios.pdf', buffer.length);
    res.send(buffer);
  }

  async generateOperativoProductosPDF(res: Response) {
    const data = await this.getOperativoProductos();
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const headers = ['Código', 'Nombre', 'Categoría', 'Precio Ref.'];
    const columnWidths = [80, 200, 120, 95];
    const rows = data.map(item => [
      item.codigo,
      item.nombre,
      item.categoria || '-',
      item.precioReferencial ? `S/ ${Number(item.precioReferencial).toFixed(2)}` : '-'
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Productos',
        undefined,
        headers,
        columnWidths,
        rows,
        formattedDate
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-productos.pdf', buffer.length);
    res.send(buffer);
  }

  async generateOperativoRequerimientosPDF(res: Response, fechaInicio?: string, fechaFin?: string) {
    const data = await this.getOperativoRequerimientos(fechaInicio, fechaFin);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const subtitle = fechaInicio || fechaFin ? `Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}` : undefined;
    const headers = ['Código', 'Solicitante', 'Estado', 'Fecha Requerida'];
    const columnWidths = [100, 180, 120, 95];
    const rows = data.map(item => [
      item.codigo,
      `${item.solicitante?.nombre || '-'} ${item.solicitante?.apellido || ''}`,
      this.formatStatus(item.estado),
      this.formatDateOnly(item.fechaRequerida)
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Requerimientos',
        subtitle,
        headers,
        columnWidths,
        rows,
        formattedDate
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-requerimientos.pdf', buffer.length);
    res.send(buffer);
  }

  async generateOperativoSolicitudesCotizacionPDF(res: Response, fechaInicio?: string, fechaFin?: string) {
    const data = await this.getOperativoSolicitudesCotizacion(fechaInicio, fechaFin);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const subtitle = fechaInicio || fechaFin ? `Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}` : undefined;
    const headers = ['Código', 'Título', 'Estado', 'Fecha Límite'];
    const columnWidths = [100, 200, 120, 95];
    const rows = data.map(item => [
      item.codigo,
      item.titulo,
      this.formatStatus(item.estado),
      new Date(item.fechaLimite).toLocaleDateString('es-PE')
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Solicitudes de Cotización',
        subtitle,
        headers,
        columnWidths,
        rows,
        formattedDate
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-solicitudes-cotizacion.pdf', buffer.length);
    res.send(buffer);
  }

  async generateOperativoOrdenesCompraPDF(res: Response, fechaInicio?: string, fechaFin?: string) {
    const data = await this.getOperativoOrdenesCompra(fechaInicio, fechaFin);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const subtitle = fechaInicio || fechaFin ? `Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}` : undefined;
    const headers = ['Número', 'Proveedor', 'Estado', 'Monto'];
    const columnWidths = [90, 180, 120, 105];
    const rows = data.map(item => [
      item.numero,
      item.proveedor?.razonSocial || '-',
      this.formatStatus(item.estado),
      `S/ ${Number(item.montoTotal).toFixed(2)}`
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Órdenes de Compra',
        subtitle,
        headers,
        columnWidths,
        rows,
        formattedDate
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-ordenes-compra.pdf', buffer.length);
    res.send(buffer);
  }

  async generateOperativoRecepcionesPDF(res: Response, fechaInicio?: string, fechaFin?: string) {
    const data = await this.getOperativoRecepciones(fechaInicio, fechaFin);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const subtitle = fechaInicio || fechaFin ? `Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}` : undefined;
    const headers = ['Orden de Compra', 'Fecha Recepción', 'Estado'];
    const columnWidths = [130, 150, 215];
    const rows = data.map(item => [
      item.ordenCompra?.numero || '-',
      new Date(item.fechaRecepcion).toLocaleDateString('es-PE'),
      this.formatStatus(item.estado)
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Recepciones',
        subtitle,
        headers,
        columnWidths,
        rows,
        formattedDate
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-recepciones.pdf', buffer.length);
    res.send(buffer);
  }

  async generateOperativoInventarioPDF(res: Response) {
    const data = await this.getOperativoInventario();
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`;
    const headers = ['Producto', 'Cantidad', 'Stock Mínimo', 'Ubicación'];
    const columnWidths = [210, 90, 90, 105];
    const rows = data.map(item => [
      item.producto?.nombre || '-',
      String(item.cantidad),
      String(item.stockMinimo),
      item.ubicacion || '-'
    ]);
    
    const buffer = await this.createPDFBuffer((doc) => {
      this.createTableWithPagination(
        doc,
        'Reporte de Inventario',
        undefined,
        headers,
        columnWidths,
        rows,
        formattedDate
      );
    });
    
    setPdfDownloadHeaders(res, 'reporte-inventario.pdf', buffer.length);
    res.send(buffer);
  }
}
