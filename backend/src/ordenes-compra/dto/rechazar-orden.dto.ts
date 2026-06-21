import { IsString, IsNotEmpty } from 'class-validator';

export class RechazarOrdenDto {
  @IsString()
  @IsNotEmpty()
  justificacion: string;
}
