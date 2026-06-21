import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

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

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: hashedPassword,
        rol: dto.rol,
        activo: dto.activo !== undefined ? dto.activo : true,
      },
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
