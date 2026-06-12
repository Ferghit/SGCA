import { IsString, IsDateString, IsInt, IsOptional, IsArray, ValidateNested, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemSolicitudDto {
  @IsString()
  descripcion: string;

  @IsPositive()
  cantidad: number;

  @IsString()
  unidadMedida: string;
}

export class CreateSolicitudCotizacionDto {
  @IsInt()
  requerimientoId: number;

  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDateString()
  fechaLimite: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemSolicitudDto)
  items: ItemSolicitudDto[];
}