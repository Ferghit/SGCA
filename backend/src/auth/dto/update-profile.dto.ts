import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'El nombre es requerido' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El apellido es requerido' })
  apellido?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato valido' })
  email?: string;
}
