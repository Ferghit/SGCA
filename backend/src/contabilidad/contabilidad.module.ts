import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContabilidadController } from './contabilidad.controller';
import { ContabilidadService } from './contabilidad.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContabilidadController],
  providers: [ContabilidadService],
})
export class ContabilidadModule {}
