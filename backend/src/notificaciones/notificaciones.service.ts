import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CrearNotificacionDto {
  emisorId?: number;
  receptorId: number;
  requerimientoId?: number;
  titulo: string;
  mensaje: string;
}

@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  async crear(data: CrearNotificacionDto) {
    return this.prisma.notificacion.create({ data });
  }

  async findByUsuario(userId: number) {
    return this.prisma.notificacion.findMany({
      where: { receptorId: userId },
      include: {
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
