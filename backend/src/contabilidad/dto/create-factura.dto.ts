import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateFacturaDetalleDto {
  @IsOptional()
  @IsInt()
  productoId?: number;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;
}

export class CreateFacturaDto {
  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsInt()
  ordenCompraId: number;

  @IsDateString()
  fechaEmision: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsString()
  archivoUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFacturaDetalleDto)
  detalles: CreateFacturaDetalleDto[];
}
