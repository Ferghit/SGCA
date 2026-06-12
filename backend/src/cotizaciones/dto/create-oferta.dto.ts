import { IsInt, IsPositive, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateOfertaDto {
  @IsInt()
  solicitudCotizacionId: number;

  @IsNumber()
  @IsPositive()
  montoTotal: number;

  @IsInt()
  @IsPositive()
  plazoEntregaDias: number;

  @IsOptional()
  @IsString()
  condicionesPago?: string;

  @IsOptional()
  @IsString()
  notasAdicionales?: string;

  @IsOptional()
  @IsString()
  archivoAdjuntoUrl?: string;
}