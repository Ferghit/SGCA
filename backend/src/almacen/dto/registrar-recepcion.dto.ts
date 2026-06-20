import { IsInt, IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RecepcionItemDto {
  @IsInt()
  ordenCompraDetalleId: number;

  @IsNumber()
  cantidadRecibida: number;

  @IsString()
  estado: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class RegistrarRecepcionDto {
  @IsInt()
  ordenCompraId: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionItemDto)
  items: RecepcionItemDto[];
}
