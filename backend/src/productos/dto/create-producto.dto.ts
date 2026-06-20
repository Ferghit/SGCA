import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @MaxLength(50)
  codigo: string;

  @IsString()
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsString()
  @MaxLength(50)
  unidadMedida: string;

  @IsString()
  @MaxLength(100)
  categoria: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precioReferencial?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activo?: boolean;
}
