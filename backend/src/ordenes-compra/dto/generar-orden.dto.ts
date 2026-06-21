import { IsInt, IsString, IsOptional } from 'class-validator';

export class GenerarOrdenDto {
  @IsInt()
  solicitudCotizacionId: number;
}
