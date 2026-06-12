import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { EstadoRequerimiento, Rol } from '@prisma/client';

@Injectable()
export class RequerimientosService {
  constructor(
    private prisma: PrismaService,
    private notificacionesService: NotificacionesService,
  ) {}

  private async generarCodigo(): Promise<string> {
    const year = new Date().getFullYear();
    const ultimo = await this.prisma.requerimiento.findFirst({
      where: { codigo: { startsWith: `REQ-${year}-` } },
      orderBy: { codigo: 'desc' },
    });

    const siguiente = ultimo
      ? parseInt(ultimo.codigo.split('-')[2], 10) + 1
      : 1;

    return `REQ-${year}-${String(siguiente).padStart(3, '0')}`;
  }

  async create(dto: CreateRequerimientoDto, userId: number) {
    const codigo = await this.generarCodigo();

    const requerimiento = await this.prisma.requerimiento.create({
      data: {
        codigo,
        solicitanteId: userId,
        prioridad: dto.prioridad,
        fechaRequerida: new Date(dto.fechaRequerida),
        descripcion: dto.descripcion,
        estado: EstadoRequerimiento.BORRADOR,
        detalles: {
          create: dto.detalles.map((d) => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            unidadMedida: d.unidadMedida,
            observacion: d.observacion,
          })),
        },
        historial: {
          create: [
            {
              estadoNuevo: EstadoRequerimiento.BORRADOR,
              usuarioId: userId,
              comentario: 'Requerimiento creado',
            },
          ],
        },
      },
      include: {
        detalles: { include: { producto: true } },
        solicitante: { select: { id: true, nombre: true, apellido: true, rol: true } },
        historial: { orderBy: { createdAt: 'asc' } },
      },
    });

    return requerimiento;
  }

  async findAll(userId: number, rol: string) {
    const where: any = {};

    if (rol === Rol.TRABAJADOR) {
      where.solicitanteId = userId;
    }

    return this.prisma.requerimiento.findMany({
      where,
      include: {
        solicitante: { select: { id: true, nombre: true, apellido: true } },
        aprobador: { select: { id: true, nombre: true, apellido: true } },
        detalles: { include: { producto: true } },
        historial: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findPendientes() {
    return this.prisma.requerimiento.findMany({
      where: { estado: EstadoRequerimiento.PENDIENTE },
      include: {
        solicitante: { select: { id: true, nombre: true, apellido: true } },
        detalles: { include: { producto: true } },
      },
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: number) {
    const req = await this.prisma.requerimiento.findUnique({
      where: { id },
      include: {
        solicitante: { select: { id: true, nombre: true, apellido: true, email: true } },
        aprobador: { select: { id: true, nombre: true, apellido: true } },
        detalles: { include: { producto: true } },
        historial: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!req) throw new NotFoundException(`Requerimiento #${id} no encontrado`);

    return req;
  }

  async submitParaAprobacion(id: number, userId: number) {
    const req = await this.findOne(id);

    if (req.solicitanteId !== userId) {
      throw new ForbiddenException('Solo el solicitante puede enviar este requerimiento');
    }

    if (req.estado !== EstadoRequerimiento.BORRADOR && req.estado !== EstadoRequerimiento.EN_REVISION) {
      throw new BadRequestException(
        'Solo se puede enviar a aprobacion un requerimiento en estado BORRADOR o EN_REVISION',
      );
    }

    const actualizado = await this.prisma.requerimiento.update({
      where: { id },
      data: {
        estado: EstadoRequerimiento.PENDIENTE,
        historial: {
          create: {
            estadoAnterior: req.estado,
            estadoNuevo: EstadoRequerimiento.PENDIENTE,
            usuarioId: userId,
            comentario: 'Requerimiento enviado para aprobacion',
          },
        },
      },
      include: {
        solicitante: { select: { id: true, nombre: true, apellido: true } },
        detalles: { include: { producto: true } },
        historial: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Notificar a todos los jefes de area
    const jefes = await this.prisma.usuario.findMany({
      where: { rol: Rol.JEFE_AREA, activo: true },
    });

    for (const jefe of jefes) {
      await this.notificacionesService.crear({
        emisorId: userId,
        receptorId: jefe.id,
        requerimientoId: id,
        titulo: `Nuevo requerimiento pendiente: ${req.codigo}`,
        mensaje: `El trabajador ${req.solicitante.nombre} ${req.solicitante.apellido} ha enviado el requerimiento ${req.codigo} con prioridad ${req.prioridad}. Por favor revise y procese.`,
      });
    }

    return actualizado;
  }

  async updateEstado(id: number, dto: UpdateEstadoDto, userId: number, rol: string) {
    const req = await this.findOne(id);

    // Validar permisos por rol y estado
    if (rol === Rol.JEFE_AREA) {
      const estadosPermitidos: EstadoRequerimiento[] = [
        EstadoRequerimiento.APROBADO,
        EstadoRequerimiento.RECHAZADO,
        EstadoRequerimiento.EN_REVISION,
      ];
      if (!estadosPermitidos.includes(dto.estado)) {
        throw new ForbiddenException('El Jefe de Area solo puede APROBAR, RECHAZAR o solicitar EN_REVISION');
      }
      if (req.estado !== EstadoRequerimiento.PENDIENTE) {
        throw new BadRequestException('Solo se pueden procesar requerimientos en estado PENDIENTE');
      }
    } else if (rol === Rol.TRABAJADOR) {
      if (req.solicitanteId !== userId) {
        throw new ForbiddenException('No tiene permiso para modificar este requerimiento');
      }
    } else {
      const rolesConAccesoTotal: Rol[] = [Rol.ADMIN, Rol.GERENTE, Rol.ANALISTA_COMPRAS];
      if (!rolesConAccesoTotal.includes(rol as Rol)) {
        throw new ForbiddenException('No tiene permiso para cambiar el estado de requerimientos');
      }
    }

    const dataUpdate: any = {
      estado: dto.estado,
      historial: {
        create: {
          estadoAnterior: req.estado,
          estadoNuevo: dto.estado,
          usuarioId: userId,
          comentario: dto.comentario,
        },
      },
    };

    if (rol === Rol.JEFE_AREA) {
      dataUpdate.aprobadorId = userId;
      dataUpdate.comentarioJefe = dto.comentario;
    }

    const actualizado = await this.prisma.requerimiento.update({
      where: { id },
      data: dataUpdate,
      include: {
        solicitante: { select: { id: true, nombre: true, apellido: true } },
        aprobador: { select: { id: true, nombre: true, apellido: true } },
        detalles: { include: { producto: true } },
        historial: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Notificar al solicitante del cambio de estado
    const estadoLabel = {
      [EstadoRequerimiento.APROBADO]: 'aprobado',
      [EstadoRequerimiento.RECHAZADO]: 'rechazado',
      [EstadoRequerimiento.EN_REVISION]: 'devuelto para correccion',
      [EstadoRequerimiento.PENDIENTE]: 'enviado a revision',
      [EstadoRequerimiento.BORRADOR]: 'guardado como borrador',
    };

    await this.notificacionesService.crear({
      emisorId: userId,
      receptorId: req.solicitanteId,
      requerimientoId: id,
      titulo: `Requerimiento ${req.codigo} ${estadoLabel[dto.estado] || dto.estado}`,
      mensaje: dto.comentario
        ? `Su requerimiento ${req.codigo} ha sido ${estadoLabel[dto.estado]}. Comentario: ${dto.comentario}`
        : `Su requerimiento ${req.codigo} ha sido ${estadoLabel[dto.estado]}.`,
    });

    return actualizado;
  }

  async getMisEstadisticas(userId: number) {
    const [total, borrador, pendiente, aprobado, rechazado, enRevision] =
      await Promise.all([
        this.prisma.requerimiento.count({ where: { solicitanteId: userId } }),
        this.prisma.requerimiento.count({ where: { solicitanteId: userId, estado: EstadoRequerimiento.BORRADOR } }),
        this.prisma.requerimiento.count({ where: { solicitanteId: userId, estado: EstadoRequerimiento.PENDIENTE } }),
        this.prisma.requerimiento.count({ where: { solicitanteId: userId, estado: EstadoRequerimiento.APROBADO } }),
        this.prisma.requerimiento.count({ where: { solicitanteId: userId, estado: EstadoRequerimiento.RECHAZADO } }),
        this.prisma.requerimiento.count({ where: { solicitanteId: userId, estado: EstadoRequerimiento.EN_REVISION } }),
      ]);

    return { total, borrador, pendiente, aprobado, rechazado, enRevision };
  }

  async getEstadisticasJefe() {
    const [total, pendientes, aprobados, rechazados, enRevision] =
      await Promise.all([
        this.prisma.requerimiento.count(),
        this.prisma.requerimiento.count({ where: { estado: EstadoRequerimiento.PENDIENTE } }),
        this.prisma.requerimiento.count({ where: { estado: EstadoRequerimiento.APROBADO } }),
        this.prisma.requerimiento.count({ where: { estado: EstadoRequerimiento.RECHAZADO } }),
        this.prisma.requerimiento.count({ where: { estado: EstadoRequerimiento.EN_REVISION } }),
      ]);

    return { total, pendientes, aprobados, rechazados, enRevision };
  }
}
