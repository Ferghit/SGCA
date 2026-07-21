import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'La contrasena actual es requerida' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'La nueva contrasena debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La nueva contrasena debe contener al menos una mayuscula, una minuscula y un numero',
  })
  newPassword: string;
}
