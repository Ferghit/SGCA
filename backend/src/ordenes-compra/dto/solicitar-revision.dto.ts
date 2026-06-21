import { IsString, IsNotEmpty } from 'class-validator';

export class SolicitarRevisionDto {
  @IsString()
  @IsNotEmpty()
  justificacion: string;
}
