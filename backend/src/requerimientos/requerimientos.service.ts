import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateRequerimientoDto } from './dto/update-requerimiento.dto';
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

  private getRequerimientoInclude() {
    return {
      solicitante: {
        select: { id: true, nombre: true, apellido: true, email: true, rol: true },
      },
      aprobador: { select: { id: true, nombre: true, apellido: true } },
      detalles: { include: { producto: true } },
      historial: { orderBy: { createdAt: 'asc' as const } },
    };
  }

  private parseDateOnly(dateValue: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

    if (!match) {
      return new Date(dateValue);
    }

    const [, year, month, day] = match;

    // Guardamos al mediodía UTC para evitar desfases de huso horario
    // cuando el frontend representa un valor semántico de solo fecha.
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
  }

  private mapRequerimientoData(dto: CreateRequerimientoDto | UpdateRequerimientoDto) {
    return {
      prioridad: dto.prioridad,
      fechaRequerida: this.parseDateOnly(dto.fechaRequerida),
      descripcion: dto.descripcion?.trim() || null,
      detalles: dto.detalles.map((d) => ({
        productoId: d.productoId,
        cantidad: d.cantidad,
        unidadMedida: d.unidadMedida,
        observacion: d.observacion?.trim() || null,
      })),
    };
  }

  private getWhereByRol(userId: number, rol: string) {
    switch (rol) {
      case Rol.ADMIN:
        return {};
      case Rol.TRABAJADOR:
        return { solicitanteId: userId };
      case Rol.JEFE_AREA:
        // Nota: hoy no existe relación de área en el modelo. Filtramos por etapa del flujo.
        return {
          estado: {
            in: [
              EstadoRequerimiento.PENDIENTE,
              EstadoRequerimiento.APROBADO,
              EstadoRequerimiento.EN_REVISION,
              EstadoRequerimiento.RECHAZADO,
            ],
          },
        };
      case Rol.GERENTE:
        return { estado: EstadoRequerimiento.APROBADO };
      case Rol.ANALISTA_COMPRAS:
        return { estado: EstadoRequerimiento.APROBADO_GERENTE };
      default:
        throw new ForbiddenException('No tiene permiso para acceder a requerimientos');
    }
  }

  private getPendientesWhereByRol(rol: string) {
    switch (rol) {
      case Rol.ADMIN:
        return {
          estado: {
            in: [
              EstadoRequerimiento.PENDIENTE,
              EstadoRequerimiento.APROBADO,
              EstadoRequerimiento.APROBADO_GERENTE,
            ],
          },
        };
      case Rol.JEFE_AREA:
        return { estado: EstadoRequerimiento.PENDIENTE };
      case Rol.GERENTE:
        return { estado: EstadoRequerimiento.APROBADO };
      case Rol.ANALISTA_COMPRAS:
        return { estado: EstadoRequerimiento.APROBADO_GERENTE };
      default:
        throw new ForbiddenException('No tiene permiso para consultar esta bandeja');
    }
  }

  private assertCanAccess(req: any, userId: number, rol: string) {
    if (rol === Rol.ADMIN) return;

    if (rol === Rol.TRABAJADOR) {
      if (req.solicitanteId !== userId) {
        throw new ForbiddenException('Solo puede acceder a sus propios requerimientos');
      }
      return;
    }

    if (rol === Rol.GERENTE) {
      if (
        [
          EstadoRequerimiento.APROBADO,
          EstadoRequerimiento.APROBADO_GERENTE,
          EstadoRequerimiento.EN_REVISION,
        ].includes(req.estado)
      ) {
        return;
      }

      throw new ForbiddenException('No tiene permiso para acceder a este requerimiento');
    }

    if (rol === Rol.PROVEEDOR) {
      throw new ForbiddenException('El proveedor no puede acceder a requerimientos');
    }

    const where = this.getWhereByRol(userId, rol);

    if (where && 'solicitanteId' in where && where.solicitanteId !== req.solicitanteId) {
      throw new ForbiddenException('No tiene permiso para acceder a este requerimiento');
    }

    if (
      where &&
      'estado' in where &&
      where.estado &&
      typeof where.estado === 'object' &&
      'in' in where.estado
    ) {
      if (!where.estado.in.includes(req.estado)) {
        throw new ForbiddenException('No tiene permiso para acceder a este requerimiento');
      }
      return;
    }

    if (where && 'estado' in where && req.estado !== where.estado) {
      throw new ForbiddenException('No tiene permiso para acceder a este requerimiento');
    }
  }

  async create(dto: CreateRequerimientoDto, userId: number) {
    const codigo = await this.generarCodigo();
    const payload = this.mapRequerimientoData(dto);

    // Validar que todos los productos existan en el catálogo
    const productoIds = payload.detalles.map((d) => d.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productoIds } },
      select: { id: true },
    });

    const productosEncontrados = new Set(productos.map((p) => p.id));
    const productosFaltantes = productoIds.filter((id) => !productosEncontrados.has(id));

    if (productosFaltantes.length > 0) {
      throw new BadRequestException(
        `Los siguientes productos no existen en el catálogo: ${productosFaltantes.join(', ')}`,
      );
    }

    return this.prisma.requerimiento.create({
      data: {
        codigo,
        solicitanteId: userId,
        prioridad: payload.prioridad,
        fechaRequerida: payload.fechaRequerida,
        descripcion: payload.descripcion,
        estado: EstadoRequerimiento.BORRADOR,
        detalles: {
          create: payload.detalles,
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
      include: this.getRequerimientoInclude(),
    });
  }

  async update(id: number, dto: UpdateRequerimientoDto, userId: number, rol: string) {
    const req = await this.prisma.requerimiento.findUnique({
      where: { id },
      include: this.getRequerimientoInclude(),
    });

    if (!req) throw new NotFoundException(`Requerimiento #${id} no encontrado`);

    if (rol !== Rol.TRABAJADOR && rol !== Rol.ADMIN) {
      throw new ForbiddenException('No tiene permiso para editar requerimientos');
    }

    if (rol === Rol.TRABAJADOR && req.solicitanteId !== userId) {
      throw new ForbiddenException('Solo puede editar sus propios requerimientos');
    }

    if (
      req.estado !== EstadoRequerimiento.BORRADOR &&
      req.estado !== EstadoRequerimiento.EN_REVISION
    ) {
      throw new BadRequestException(
        'Solo se pueden editar requerimientos en estado BORRADOR o EN_REVISION',
      );
    }

    const payload = this.mapRequerimientoData(dto);

    return this.prisma.requerimiento.update({
      where: { id },
      data: {
        prioridad: payload.prioridad,
        fechaRequerida: payload.fechaRequerida,
        descripcion: payload.descripcion,
        detalles: {
          deleteMany: {},
          create: payload.detalles,
        },
        historial: {
          create: {
            estadoAnterior: req.estado,
            estadoNuevo: req.estado,
            usuarioId: userId,
            comentario:
              req.estado === EstadoRequerimiento.EN_REVISION
                ? 'Requerimiento corregido tras observaciones'
                : 'Requerimiento actualizado en borrador',
          },
        },
      },
      include: this.getRequerimientoInclude(),
    });
  }

  async findAll(userId: number, rol: string) {
    const where = this.getWhereByRol(userId, rol);

    return this.prisma.requerimiento.findMany({
      where,
      include: this.getRequerimientoInclude(),
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findPendientes(userId: number, rol: string) {
    const where = this.getPendientesWhereByRol(rol);

    if (rol === Rol.TRABAJADOR) {
      throw new ForbiddenException('No tiene permiso para acceder a esta bandeja');
    }

    return this.prisma.requerimiento.findMany({
      where,
      include: this.getRequerimientoInclude(),
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: number, userId: number, rol: string) {
    const req = await this.prisma.requerimiento.findUnique({
      where: { id },
      include: this.getRequerimientoInclude(),
    });

    if (!req) throw new NotFoundException(`Requerimiento #${id} no encontrado`);

    this.assertCanAccess(req, userId, rol);

    return req;
  }

  async submitParaAprobacion(id: number, userId: number) {
    const req = await this.prisma.requerimiento.findUnique({
      where: { id },
      include: this.getRequerimientoInclude(),
    });

    if (!req) throw new NotFoundException(`Requerimiento #${id} no encontrado`);

    if (req.solicitanteId !== userId) {
      throw new ForbiddenException('Solo el solicitante puede enviar este requerimiento');
    }

    if (
      req.estado !== EstadoRequerimiento.BORRADOR &&
      req.estado !== EstadoRequerimiento.EN_REVISION
    ) {
      throw new BadRequestException(
        'Solo se puede enviar a aprobacion un requerimiento en estado BORRADOR o EN_REVISION',
      );
    }

    const actualizado = await this.prisma.requerimiento.update({
      where: { id },
      data: {
        estado: EstadoRequerimiento.PENDIENTE,
        comentarioJefe: null,
        historial: {
          create: {
            estadoAnterior: req.estado,
            estadoNuevo: EstadoRequerimiento.PENDIENTE,
            usuarioId: userId,
            comentario: 'Requerimiento enviado para aprobacion',
          },
        },
      },
      include: this.getRequerimientoInclude(),
    });

    const jefes = await this.prisma.usuario.findMany({
      where: { rol: Rol.JEFE_AREA, activo: true },
      select: { id: true },
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
    const req = await this.prisma.requerimiento.findUnique({
      where: { id },
      include: this.getRequerimientoInclude(),
    });

    if (!req) throw new NotFoundException(`Requerimiento #${id} no encontrado`);

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

    if ((rol === Rol.JEFE_AREA || rol === Rol.ADMIN) && req.estado === EstadoRequerimiento.PENDIENTE) {
      const estadosPermitidos: EstadoRequerimiento[] = [
        EstadoRequerimiento.APROBADO,
        EstadoRequerimiento.RECHAZADO,
        EstadoRequerimiento.EN_REVISION,
      ];

      if (!estadosPermitidos.includes(dto.estado)) {
        throw new ForbiddenException(
          'El Jefe de Area solo puede aprobar, rechazar o solicitar correccion',
        );
      }

      dataUpdate.aprobadorId = userId;
      dataUpdate.comentarioJefe = dto.comentario?.trim() || null;
    } else if (
      (rol === Rol.GERENTE || rol === Rol.ADMIN) &&
      req.estado === EstadoRequerimiento.APROBADO
    ) {
      const estadosPermitidos: EstadoRequerimiento[] = [
        EstadoRequerimiento.APROBADO_GERENTE,
        EstadoRequerimiento.EN_REVISION,
      ];

      if (!estadosPermitidos.includes(dto.estado)) {
        throw new ForbiddenException(
          'El Gerente solo puede aprobar gerencialmente o devolver a observaciones',
        );
      }

      dataUpdate.comentarioJefe = dto.comentario?.trim() || null;
    } else {
      throw new ForbiddenException('No tiene permiso para cambiar el estado de este requerimiento');
    }

    const actualizado = await this.prisma.requerimiento.update({
      where: { id },
      data: dataUpdate,
      include: this.getRequerimientoInclude(),
    });

    const estadoLabel = {
      [EstadoRequerimiento.APROBADO]: 'aprobado por jefe de área y enviado a gerencia',
      [EstadoRequerimiento.APROBADO_GERENTE]: 'aprobado por gerencia',
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

    if (dto.estado === EstadoRequerimiento.APROBADO) {
      const gerentes = await this.prisma.usuario.findMany({
        where: { rol: Rol.GERENTE, activo: true },
        select: { id: true },
      });

      for (const gerente of gerentes) {
        await this.notificacionesService.crear({
          emisorId: userId,
          receptorId: gerente.id,
          requerimientoId: id,
          titulo: `Aprobación gerencial pendiente: ${req.codigo}`,
          mensaje: `El requerimiento ${req.codigo} ya fue aprobado por Jefatura y está pendiente de su aprobación gerencial.`,
        });
      }
    }

    return actualizado;
  }

  async getMisEstadisticas(userId: number) {
    const [total, borrador, pendiente, aprobado, rechazado, enRevision] =
      await Promise.all([
        this.prisma.requerimiento.count({ where: { solicitanteId: userId } }),
        this.prisma.requerimiento.count({
          where: { solicitanteId: userId, estado: EstadoRequerimiento.BORRADOR },
        }),
        this.prisma.requerimiento.count({
          where: { solicitanteId: userId, estado: EstadoRequerimiento.PENDIENTE },
        }),
        this.prisma.requerimiento.count({
          where: {
            solicitanteId: userId,
            estado: {
              in: [
                EstadoRequerimiento.APROBADO,
                EstadoRequerimiento.APROBADO_GERENTE,
              ],
            },
          },
        }),
        this.prisma.requerimiento.count({
          where: { solicitanteId: userId, estado: EstadoRequerimiento.RECHAZADO },
        }),
        this.prisma.requerimiento.count({
          where: { solicitanteId: userId, estado: EstadoRequerimiento.EN_REVISION },
        }),
      ]);

    return { total, borrador, pendiente, aprobado, rechazado, enRevision };
  }

  async getEstadisticasJefe() {
    const [total, pendientes, aprobados, rechazados, enRevision] =
      await Promise.all([
        this.prisma.requerimiento.count(),
        this.prisma.requerimiento.count({
          where: { estado: EstadoRequerimiento.PENDIENTE },
        }),
        this.prisma.requerimiento.count({
          where: {
            estado: {
              in: [
                EstadoRequerimiento.APROBADO,
                EstadoRequerimiento.APROBADO_GERENTE,
              ],
            },
          },
        }),
        this.prisma.requerimiento.count({
          where: { estado: EstadoRequerimiento.RECHAZADO },
        }),
        this.prisma.requerimiento.count({
          where: { estado: EstadoRequerimiento.EN_REVISION },
        }),
      ]);

    return { total, pendientes, aprobados, rechazados, enRevision };
  }
}
