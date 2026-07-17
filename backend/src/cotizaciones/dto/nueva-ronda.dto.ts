import { IsDateString, IsOptional, IsString } from 'class-validator';

export class NuevaRondaCotizacionDto {
  @IsDateString()
  fechaLimite: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
