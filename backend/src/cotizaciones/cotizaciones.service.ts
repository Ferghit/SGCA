import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudCotizacionDto } from './dto/create-solicitud.dto';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { SeleccionarGanadorDto } from './dto/seleccionar-ganador.dto';
import { EstadoSolicitudCotizacion, EstadoRequerimiento } from '@prisma/client';

@Injectable()
export class CotizacionesService {
  constructor(private prisma: PrismaService) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async generarCodigo(): Promise<string> {
    const year = new Date().getFullYear();
    const ultimo = await this.prisma.solicitudCotizacion.findFirst({
      where: { codigo: { startsWith: `COT-${year}-` } },
      orderBy: { codigo: 'desc' },
    });
    const siguiente = ultimo ? parseInt(ultimo.codigo.split('-')[2], 10) + 1 : 1;
    return `COT-${year}-${String(siguiente).padStart(3, '0')}`;
  }

  // ─── Solicitudes de Cotización ──────────────────────────────────────────────

  async crearSolicitud(dto: CreateSolicitudCotizacionDto, analistaId: number) {
    const requerimiento = await this.prisma.requerimiento.findUnique({
      where: { id: dto.requerimientoId },
    });

    if (!requerimiento) {
      throw new NotFoundException('Requerimiento no encontrado');
    }

    if (requerimiento.estado !== EstadoRequerimiento.APROBADO) {
      throw new BadRequestException(
        'Solo se pueden cotizar requerimientos en estado APROBADO',
      );
    }

    // Verificar que no exista ya una solicitud activa para este requerimiento
    const existente = await this.prisma.solicitudCotizacion.findFirst({
      where: {
        requerimientoId: dto.requerimientoId,
        estado: { in: ['ABIERTA', 'CERRADA'] },
      },
    });
    if (existente) {
      throw new BadRequestException(
        'Ya existe una solicitud de cotización activa para este requerimiento',
      );
    }

    const codigo = await this.generarCodigo();

    return this.prisma.solicitudCotizacion.create({
      data: {
        codigo,
        requerimientoId: dto.requerimientoId,
        analistaId,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        fechaLimite: new Date(dto.fechaLimite),
        items: {
          create: dto.items.map((item) => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            unidadMedida: item.unidadMedida,
          })),
        },
      },
      include: {
        requerimiento: true,
        analista: { select: { id: true, nombre: true, apellido: true } },
        items: true,
        ofertas: true,
      },
    });
  }

  async findAllSolicitudes(userRol: string, userId: number) {
    const where: any = {};

    // Proveedor: solo ve las abiertas
    if (userRol === 'PROVEEDOR') {
      where.estado = EstadoSolicitudCotizacion.ABIERTA;
    }

    return this.prisma.solicitudCotizacion.findMany({
      where,
      include: {
        requerimiento: { select: { id: true, codigo: true, descripcion: true } },
        analista: { select: { id: true, nombre: true, apellido: true } },
        items: true,
        ofertas: {
          include: {
            proveedor: { select: { id: true, razonSocial: true, ruc: true } },
          },
        },
        proveedorGanador: { select: { id: true, razonSocial: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneSolicitud(id: number) {
    const solicitud = await this.prisma.solicitudCotizacion.findUnique({
      where: { id },
      include: {
        requerimiento: {
          include: {
            detalles: { include: { producto: true } },
            solicitante: { select: { id: true, nombre: true, apellido: true } },
          },
        },
        analista: { select: { id: true, nombre: true, apellido: true } },
        items: true,
        ofertas: {
          include: {
            proveedor: { select: { id: true, razonSocial: true, ruc: true, email: true } },
          },
          orderBy: { puntajeTotal: 'desc' },
        },
        proveedorGanador: true,
      },
    });

    if (!solicitud) throw new NotFoundException('Solicitud de cotización no encontrada');
    return solicitud;
  }

  // ─── Cierre automático por fecha límite ─────────────────────────────────────

  async cerrarSolicitudesVencidas() {
    const ahora = new Date();
    const vencidas = await this.prisma.solicitudCotizacion.findMany({
      where: { estado: EstadoSolicitudCotizacion.ABIERTA, fechaLimite: { lte: ahora } },
      include: { ofertas: true },
    });

    for (const solicitud of vencidas) {
      // Calcular ranking
      if (solicitud.ofertas.length > 0) {
        await this.calcularRanking(solicitud.id);
      }

      await this.prisma.solicitudCotizacion.update({
        where: { id: solicitud.id },
        data: { estado: EstadoSolicitudCotizacion.CERRADA },
      });
    }

    return { cerradas: vencidas.length };
  }

  // ─── Ranking ponderado ───────────────────────────────────────────────────────

  async calcularRanking(solicitudId: number) {
    const ofertas = await this.prisma.ofertaProveedor.findMany({
      where: { solicitudCotizacionId: solicitudId },
      include: {
        proveedor: {
          include: { ofertasProveedor: { where: { estado: 'SELECCIONADA' } } },
        },
      },
    });

    if (ofertas.length === 0) return [];

    // Normalizar: menor precio → mayor puntaje, menor plazo → mayor puntaje
    const montos = ofertas.map((o) => Number(o.montoTotal));
    const plazos = ofertas.map((o) => o.plazoEntregaDias);
    const minMonto = Math.min(...montos);
    const maxMonto = Math.max(...montos);
    const minPlazo = Math.min(...plazos);
    const maxPlazo = Math.max(...plazos);

    const pesos = { precio: 0.5, plazo: 0.3, historial: 0.2 };

    const ofertasConPuntaje = ofertas.map((o) => {
      // Precio: 100 puntos al más barato, proporcional al resto
      const puntajePrecio =
        maxMonto === minMonto
          ? 100
          : ((maxMonto - Number(o.montoTotal)) / (maxMonto - minMonto)) * 100;

      // Plazo: 100 puntos al más rápido
      const puntajePlazo =
        maxPlazo === minPlazo
          ? 100
          : ((maxPlazo - o.plazoEntregaDias) / (maxPlazo - minPlazo)) * 100;

      // Historial: % de veces que fue seleccionado sobre total de ofertas
      const totalOfertas = o.proveedor.ofertasProveedor.length;
      const puntajeHistorial = totalOfertas > 0 ? Math.min(100, totalOfertas * 10) : 50;

      const puntajeTotal =
        puntajePrecio * pesos.precio +
        puntajePlazo * pesos.plazo +
        puntajeHistorial * pesos.historial;

      return { id: o.id, puntajePrecio, puntajePlazo, puntajeHistorial, puntajeTotal };
    });

    // Ordenar por puntaje total DESC para asignar posición
    ofertasConPuntaje.sort((a, b) => b.puntajeTotal - a.puntajeTotal);

    // Guardar en BD
    for (let i = 0; i < ofertasConPuntaje.length; i++) {
      const op = ofertasConPuntaje[i];
      await this.prisma.ofertaProveedor.update({
        where: { id: op.id },
        data: {
          puntajePrecio: op.puntajePrecio,
          puntajePlazo: op.puntajePlazo,
          puntajeHistorial: op.puntajeHistorial,
          puntajeTotal: op.puntajeTotal,
          posicionRanking: i + 1,
        },
      });
    }

    return ofertasConPuntaje;
  }

  // ─── Ofertas (Portal Proveedor) ──────────────────────────────────────────────

  async enviarOferta(dto: CreateOfertaDto, userId: number) {
    // Buscar proveedor por email del usuario
    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
    const proveedorRegistrado = await this.prisma.proveedor.findFirst({
      where: { email: usuario?.email },
    });

    if (!proveedorRegistrado) {
      throw new BadRequestException(
        'No existe un perfil de proveedor asociado a su cuenta. Contacte al administrador.',
      );
    }

    const solicitud = await this.prisma.solicitudCotizacion.findUnique({
      where: { id: dto.solicitudCotizacionId },
    });

    if (!solicitud) throw new NotFoundException('Solicitud de cotización no encontrada');

    if (solicitud.estado !== EstadoSolicitudCotizacion.ABIERTA) {
      throw new BadRequestException('La solicitud de cotización ya está cerrada');
    }

    if (new Date() > solicitud.fechaLimite) {
      throw new BadRequestException('El plazo para enviar cotizaciones ha vencido');
    }

    // Verificar si ya existe una oferta de este proveedor
    const ofertaExistente = await this.prisma.ofertaProveedor.findUnique({
      where: {
        solicitudCotizacionId_proveedorId: {
          solicitudCotizacionId: dto.solicitudCotizacionId,
          proveedorId: proveedorRegistrado.id,
        },
      },
    });

    if (ofertaExistente) {
      // Actualizar oferta existente
      return this.prisma.ofertaProveedor.update({
        where: { id: ofertaExistente.id },
        data: {
          montoTotal: dto.montoTotal,
          plazoEntregaDias: dto.plazoEntregaDias,
          condicionesPago: dto.condicionesPago,
          notasAdicionales: dto.notasAdicionales,
          archivoAdjuntoUrl: dto.archivoAdjuntoUrl,
        },
      });
    }

    return this.prisma.ofertaProveedor.create({
      data: {
        solicitudCotizacionId: dto.solicitudCotizacionId,
        proveedorId: proveedorRegistrado.id,
        montoTotal: dto.montoTotal,
        plazoEntregaDias: dto.plazoEntregaDias,
        condicionesPago: dto.condicionesPago,
        notasAdicionales: dto.notasAdicionales,
        archivoAdjuntoUrl: dto.archivoAdjuntoUrl,
      },
      include: {
        proveedor: { select: { id: true, razonSocial: true } },
        solicitudCotizacion: { select: { id: true, codigo: true, titulo: true } },
      },
    });
  }

  async getMisOfertas(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { email: usuario?.email },
    });
    if (!proveedor) return [];

    return this.prisma.ofertaProveedor.findMany({
      where: { proveedorId: proveedor.id },
      include: {
        solicitudCotizacion: {
          include: {
            items: true,
            requerimiento: { select: { id: true, codigo: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Selección del ganador ──────────────────────────────────────────────────

  async seleccionarGanador(solicitudId: number, dto: SeleccionarGanadorDto) {
    const solicitud = await this.prisma.solicitudCotizacion.findUnique({
      where: { id: solicitudId },
      include: { ofertas: true },
    });

    if (!solicitud) throw new NotFoundException('Solicitud de cotización no encontrada');

    if (solicitud.estado !== EstadoSolicitudCotizacion.CERRADA) {
      throw new BadRequestException(
        'Solo se puede seleccionar el ganador de una solicitud CERRADA',
      );
    }

    const oferta = await this.prisma.ofertaProveedor.findFirst({
      where: { id: dto.ofertaId, solicitudCotizacionId: solicitudId },
    });

    if (!oferta) throw new NotFoundException('Oferta no encontrada');

    // Marcar todas las ofertas como rechazadas
    await this.prisma.ofertaProveedor.updateMany({
      where: { solicitudCotizacionId: solicitudId },
      data: { estado: 'RECHAZADA' },
    });

    // Marcar la seleccionada
    await this.prisma.ofertaProveedor.update({
      where: { id: dto.ofertaId },
      data: { estado: 'SELECCIONADA' },
    });

    // Actualizar solicitud con ganador y justificación
    const solicitudActualizada = await this.prisma.solicitudCotizacion.update({
      where: { id: solicitudId },
      data: {
        estado: EstadoSolicitudCotizacion.ADJUDICADA,
        proveedorGanadorId: oferta.proveedorId,
        justificacionSeleccion: dto.justificacion,
      },
      include: {
        proveedorGanador: true,
        ofertas: {
          include: { proveedor: { select: { id: true, razonSocial: true } } },
          orderBy: { posicionRanking: 'asc' },
        },
      },
    });

    return solicitudActualizada;
  }

  // ─── Requerimientos aprobados disponibles para cotizar ─────────────────────

  async getRequerimientosAprobados() {
    return this.prisma.requerimiento.findMany({
      where: {
        estado: EstadoRequerimiento.APROBADO,
        solicitudesCotizacion: { none: { estado: { in: ['ABIERTA', 'CERRADA', 'ADJUDICADA'] } } },
      },
      include: {
        detalles: { include: { producto: true } },
        solicitante: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Reporte comparativo para el Analista ──────────────────────────────────

  async getReporteComparativo(solicitudId: number) {
    const solicitud = await this.findOneSolicitud(solicitudId);

    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    // Si está cerrada y tiene ofertas sin ranking, calcularlo
    if (
      solicitud.estado === EstadoSolicitudCotizacion.CERRADA &&
      solicitud.ofertas.some((o: any) => o.puntajeTotal === null)
    ) {
      await this.calcularRanking(solicitudId);
      return this.findOneSolicitud(solicitudId);
    }

    return solicitud;
  }

  // ─── Forzar cierre y calcular ranking (para pruebas o acción manual) ────────

  async cerrarManual(solicitudId: number, analistaId: number) {
    const solicitud = await this.prisma.solicitudCotizacion.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.analistaId !== analistaId) {
      throw new ForbiddenException('Solo el analista que creó esta solicitud puede cerrarla');
    }
    if (solicitud.estado !== EstadoSolicitudCotizacion.ABIERTA) {
      throw new BadRequestException('La solicitud ya está cerrada o adjudicada');
    }

    // Primero calculamos el ranking
    await this.calcularRanking(solicitudId);

    // Luego cerramos la solicitud
    const updated = await this.prisma.solicitudCotizacion.update({
      where: { id: solicitudId },
      data: { estado: EstadoSolicitudCotizacion.CERRADA },
      include: {
        requerimiento: { select: { id: true, codigo: true, descripcion: true } },
        analista: { select: { id: true, nombre: true, apellido: true } },
        items: true,
        ofertas: {
          include: {
            proveedor: { select: { id: true, razonSocial: true, ruc: true, email: true } },
          },
          orderBy: { puntajeTotal: 'desc' },
        },
        proveedorGanador: true,
      },
    });

    return updated;
  }
}