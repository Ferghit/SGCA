import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Rol } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        password: true,
        rol: true,
        activo: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.activo) {
      throw new UnauthorizedException('Usuario inactivo. Contacte al administrador.');
    }

    const payload = { sub: user.id, email: user.email, rol: user.rol };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
      },
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (exists) {
      throw new ConflictException('El email ya esta registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: hashedPassword,
        rol: dto.rol || Rol.TRABAJADOR,
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

    return user;
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from google');
    }

    const { googleId, email } = req.user;

    let user = await this.prisma.usuario.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await this.prisma.usuario.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('El correo no está registrado en el sistema.');
      }

      user = await this.prisma.usuario.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    if (!user.activo) {
      throw new UnauthorizedException('Usuario inactivo. Contacte al administrador.');
    }

    const payload = { sub: user.id, email: user.email, rol: user.rol };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
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

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // Si se está actualizando el email, verificar que no esté en uso por otro usuario
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        ...(dto.nombre && { nombre: dto.nombre.trim() }),
        ...(dto.apellido && { apellido: dto.apellido.trim() }),
        ...(dto.email && { email: dto.email.trim() }),
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

    return updatedUser;
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // Verificar que la contraseña actual sea correcta
    const passwordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!passwordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const samePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (samePassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
