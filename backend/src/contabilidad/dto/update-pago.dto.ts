import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { EstadoPago } from '@prisma/client';

export class UpdatePagoDto {
  @IsEnum(EstadoPago)
  estado: EstadoPago;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsOptional()
  @IsString()
  metodoPago?: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
