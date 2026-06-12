import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Rol } from '@prisma/client';

export class RegisterDto {
  @IsString({ message: 'El nombre es requerido' })
  nombre: string;

  @IsString({ message: 'El apellido es requerido' })
  apellido: string;

  @IsEmail({}, { message: 'El email debe tener un formato valido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  password: string;

  @IsEnum(Rol, { message: 'El rol debe ser uno de los roles permitidos' })
  @IsOptional()
  rol?: Rol;
}
