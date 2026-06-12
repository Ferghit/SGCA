import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoRequerimiento } from '@prisma/client';

export class UpdateEstadoDto {
  @IsEnum(EstadoRequerimiento, {
    message: 'El estado debe ser BORRADOR, PENDIENTE, APROBADO, RECHAZADO o EN_REVISION',
  })
  estado: EstadoRequerimiento;

  @IsOptional()
  @IsString()
  comentario?: string;
}
