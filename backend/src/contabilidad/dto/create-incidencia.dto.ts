import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { TipoIncidencia } from '@prisma/client';

export class CreateIncidenciaDto {
  @IsInt()
  proveedorId: number;

  @IsOptional()
  @IsInt()
  ordenCompraId?: number;

  @IsEnum(TipoIncidencia)
  tipo: TipoIncidencia;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  impacto?: number;

  @IsOptional()
  @IsString()
  accionCorrectiva?: string;
}
