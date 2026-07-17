import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoItemRecepcion } from '@prisma/client';

class RecepcionItemDto {
  @IsInt()
  @Min(1)
  ordenCompraDetalleId: number;

  @IsNumber()
  @Min(0)
  cantidadRecibida: number;

  @IsEnum(EstadoItemRecepcion)
  estado: EstadoItemRecepcion;

  @ValidateIf((item: RecepcionItemDto) => item.estado === EstadoItemRecepcion.DANADO)
  @IsString()
  observacion?: string;
}

export class RegistrarRecepcionDto {
  @IsInt()
  @Min(1)
  ordenCompraId: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RecepcionItemDto)
  items: RecepcionItemDto[];
}