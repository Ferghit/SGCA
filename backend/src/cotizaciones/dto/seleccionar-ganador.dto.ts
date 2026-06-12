import { IsInt, IsOptional, IsString } from 'class-validator';

export class SeleccionarGanadorDto {
  @IsInt()
  ofertaId: number;

  @IsOptional()
  @IsString()
  justificacion?: string;
}