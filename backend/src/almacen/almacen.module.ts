import { Module } from '@nestjs/common'; 
import { AlmacenService } from './almacen.service'; 
import { AlmacenController } from './almacen.controller'; 
import { PrismaModule } from '../prisma/prisma.module'; 
 
@Module({ 
  imports: [PrismaModule], 
  controllers: [AlmacenController], 
  providers: [AlmacenService], 
}) 
export class AlmacenModule {} 
