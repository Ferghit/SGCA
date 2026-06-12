/*
  Warnings:

  - You are about to drop the column `monto` on the `ofertas_proveedor` table. All the data in the column will be lost.
  - You are about to drop the column `plazoEntrega` on the `ofertas_proveedor` table. All the data in the column will be lost.
  - The `estado` column on the `ofertas_proveedor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `proveedorId` on the `solicitudes_cotizacion` table. All the data in the column will be lost.
  - The `estado` column on the `solicitudes_cotizacion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[solicitudCotizacionId,proveedorId]` on the table `ofertas_proveedor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `montoTotal` to the `ofertas_proveedor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plazoEntregaDias` to the `ofertas_proveedor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proveedorId` to the `ofertas_proveedor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ofertas_proveedor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `analistaId` to the `solicitudes_cotizacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titulo` to the `solicitudes_cotizacion` table without a default value. This is not possible if the table is not empty.
  - Made the column `requerimientoId` on table `solicitudes_cotizacion` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EstadoSolicitudCotizacion" AS ENUM ('ABIERTA', 'CERRADA', 'ADJUDICADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoOferta" AS ENUM ('RECIBIDA', 'SELECCIONADA', 'RECHAZADA');

-- DropForeignKey
ALTER TABLE "solicitudes_cotizacion" DROP CONSTRAINT "solicitudes_cotizacion_proveedorId_fkey";

-- AlterTable
ALTER TABLE "ofertas_proveedor" DROP COLUMN "monto",
DROP COLUMN "plazoEntrega",
ADD COLUMN     "archivoAdjuntoUrl" TEXT,
ADD COLUMN     "montoTotal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "notasAdicionales" TEXT,
ADD COLUMN     "plazoEntregaDias" INTEGER NOT NULL,
ADD COLUMN     "posicionRanking" INTEGER,
ADD COLUMN     "proveedorId" INTEGER NOT NULL,
ADD COLUMN     "puntajeHistorial" DECIMAL(5,2),
ADD COLUMN     "puntajePlazo" DECIMAL(5,2),
ADD COLUMN     "puntajePrecio" DECIMAL(5,2),
ADD COLUMN     "puntajeTotal" DECIMAL(5,2),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoOferta" NOT NULL DEFAULT 'RECIBIDA';

-- AlterTable
ALTER TABLE "solicitudes_cotizacion" DROP COLUMN "proveedorId",
ADD COLUMN     "analistaId" INTEGER NOT NULL,
ADD COLUMN     "justificacionSeleccion" TEXT,
ADD COLUMN     "proveedorGanadorId" INTEGER,
ADD COLUMN     "titulo" TEXT NOT NULL,
ALTER COLUMN "requerimientoId" SET NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoSolicitudCotizacion" NOT NULL DEFAULT 'ABIERTA';

-- CreateTable
CREATE TABLE "items_solicitud_cotizacion" (
    "id" SERIAL NOT NULL,
    "solicitudCotizacionId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "unidadMedida" TEXT NOT NULL,

    CONSTRAINT "items_solicitud_cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ofertas_proveedor_solicitudCotizacionId_proveedorId_key" ON "ofertas_proveedor"("solicitudCotizacionId", "proveedorId");

-- AddForeignKey
ALTER TABLE "solicitudes_cotizacion" ADD CONSTRAINT "solicitudes_cotizacion_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_cotizacion" ADD CONSTRAINT "solicitudes_cotizacion_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_cotizacion" ADD CONSTRAINT "solicitudes_cotizacion_proveedorGanadorId_fkey" FOREIGN KEY ("proveedorGanadorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_solicitud_cotizacion" ADD CONSTRAINT "items_solicitud_cotizacion_solicitudCotizacionId_fkey" FOREIGN KEY ("solicitudCotizacionId") REFERENCES "solicitudes_cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas_proveedor" ADD CONSTRAINT "ofertas_proveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
