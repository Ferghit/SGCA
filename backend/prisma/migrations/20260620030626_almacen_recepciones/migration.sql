-- CreateEnum
CREATE TYPE "EstadoItemRecepcion" AS ENUM ('CONFORME', 'DANADO', 'FALTANTE');

-- AlterTable
ALTER TABLE "inventario" ADD COLUMN     "stockMinimo" DECIMAL(10,2) NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "recepcion_detalles" ADD COLUMN     "estado" "EstadoItemRecepcion" NOT NULL DEFAULT 'CONFORME';

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" SERIAL NOT NULL,
    "recepcionId" INTEGER NOT NULL,
    "productoId" INTEGER,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "notificada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_recepcionId_fkey" FOREIGN KEY ("recepcionId") REFERENCES "recepciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
