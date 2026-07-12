import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CrearNotificacionDto {
  emisorId?: number;
  receptorId: number;
  requerimientoId?: number;
  ordenCompraId?: number;
  titulo: string;
  mensaje: string;
}

@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  private getBaseSelect() {
    return {
      id: true,
      emisorId: true,
      receptorId: true,
      requerimientoId: true,
      titulo: true,
      mensaje: true,
      leida: true,
      createdAt: true,
    } as const;
  }

  async crear(data: CrearNotificacionDto) {
    // La tabla real `notificaciones` aún no tiene `ordenCompraId`.
    // Evitamos que Prisma intente leer/escribir esa columna hasta que la BD se alinee.
    const { ordenCompraId: _omitOrdenCompraId, ...safeData } = data;

    return this.prisma.notificacion.create({
      data: safeData,
      select: this.getBaseSelect(),
    });
  }

  async findByUsuario(userId: number) {
    return this.prisma.notificacion.findMany({
      where: { receptorId: userId },
      select: {
        ...this.getBaseSelect(),
        emisor: { select: { id: true, nombre: true, apellido: true } },
        requerimiento: { select: { id: true, codigo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async marcarLeida(id: number, userId: number) {
    return this.prisma.notificacion.updateMany({
      where: { id, receptorId: userId },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(userId: number) {
    return this.prisma.notificacion.updateMany({
      where: { receptorId: userId, leida: false },
      data: { leida: true },
    });
  }

  async contarNoLeidas(userId: number) {
    const count = await this.prisma.notificacion.count({
      where: { receptorId: userId, leida: false },
    });
    return { count };
  }
}
