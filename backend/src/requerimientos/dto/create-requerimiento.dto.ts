import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prioridad } from '@prisma/client';

export class DetalleRequerimientoDto {
  @IsNumber()
  @IsPositive({ message: 'El producto debe ser un ID valido' })
  productoId: number;

  @IsNumber()
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @IsString({ message: 'La unidad de medida es requerida' })
  unidadMedida: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class CreateRequerimientoDto {
  @IsEnum(Prioridad, { message: 'La prioridad debe ser BAJA, MEDIA, ALTA o URGENTE' })
  prioridad: Prioridad;

  @IsDateString({}, { message: 'La fecha requerida debe tener formato ISO valido' })
  fechaRequerida: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsArray({ message: 'Los detalles deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => DetalleRequerimientoDto)
  detalles: DetalleRequerimientoDto[];
}
