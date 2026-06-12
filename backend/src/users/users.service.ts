import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);

    return user;
  }

  async toggleActivo(id: number) {
    const user = await this.findOne(id);

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !user.activo },
      select: { id: true, activo: true },
    });
  }

  async findByRol(rol: string) {
    return this.prisma.usuario.findMany({
      where: { rol: rol as any, activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
    });
  }
}
