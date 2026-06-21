-- CreateEnum
ALTER TYPE "EstadoFactura" ADD VALUE IF NOT EXISTS 'OBSERVADA';

-- CreateEnum
CREATE TYPE "EstadoCruceFactura" AS ENUM ('CONFORME', 'OBSERVADA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESADO', 'OBSERVADO');

-- CreateEnum
CREATE TYPE "TipoIncidencia" AS ENUM ('RECLAMO', 'DEVOLUCION', 'INCUMPLIMIENTO');

-- CreateEnum
CREATE TYPE "EstadoIncidencia" AS ENUM ('ABIERTA', 'EN_REVISION', 'RESUELTA');

-- AlterTable
ALTER TABLE "facturas"
ADD COLUMN "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN "estadoCruce" "EstadoCruceFactura" NOT NULL DEFAULT 'OBSERVADA',
ADD COLUMN "resultadoCruce" JSONB,
ADD COLUMN "archivoUrl" TEXT,
ADD COLUMN "observacionesCruce" TEXT,
ADD COLUMN "contadorId" INTEGER;

-- AlterTable
ALTER TABLE "pagos"
ADD COLUMN "estado" "EstadoPago" NOT NULL DEFAULT 'PROCESADO',
ADD COLUMN "observaciones" TEXT;

-- CreateTable
CREATE TABLE "factura_detalles" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "productoId" INTEGER,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "factura_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidencias_proveedor" (
    "id" SERIAL NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "ordenCompraId" INTEGER,
    "tipo" "TipoIncidencia" NOT NULL,
    "estado" "EstadoIncidencia" NOT NULL DEFAULT 'ABIERTA',
    "descripcion" TEXT NOT NULL,
    "impacto" INTEGER NOT NULL DEFAULT 1,
    "accionCorrectiva" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidencias_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desempeno_proveedores" (
    "id" SERIAL NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "transacciones" INTEGER NOT NULL DEFAULT 0,
    "entregasConformes" INTEGER NOT NULL DEFAULT 0,
    "incidencias" INTEGER NOT NULL DEFAULT 0,
    "puntajeCumplimiento" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "puntajePrecio" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "puntajeTotal" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "ultimaTransaccion" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desempeno_proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desempeno_proveedores_proveedorId_key" ON "desempeno_proveedores"("proveedorId");

-- AddForeignKey
ALTER TABLE "factura_detalles" ADD CONSTRAINT "factura_detalles_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura_detalles" ADD CONSTRAINT "factura_detalles_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias_proveedor" ADD CONSTRAINT "incidencias_proveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias_proveedor" ADD CONSTRAINT "incidencias_proveedor_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desempeno_proveedores" ADD CONSTRAINT "desempeno_proveedores_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
