import { IsOptional, IsString } from 'class-validator';

export class AprobarOrdenDto {
  @IsOptional()
  @IsString()
  observaciones?: string;
}
