import { IsInt, IsString, IsNumber, IsOptional } from 'class-validator'; 
 
export class RegistrarDevolucionDto { 
  @IsInt() 
  recepcionId: number; 
 
  @IsOptional() 
  @IsInt() 
  productoId?: number; 
 
  @IsString() 
  descripcion: string; 
 
  @IsNumber() 
  cantidad: number; 
 
  @IsString() 
  motivo: string; 
} 
