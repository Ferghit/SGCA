import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Rol } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(Rol)
  rol: Rol;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
