/*
  Warnings:

  - The values [BORRADOR,ENVIADA,RECIBIDA_PARCIAL,RECIBIDA_COMPLETA] on the enum `EstadoOrdenCompra` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `igv` to the `ordenes_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ofertaGanadoraId` to the `ordenes_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solicitudCotizacionId` to the `ordenes_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `ordenes_compra` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
-- This table must exist before EstadoOrdenCompra is replaced below because its
-- enum columns are converted as part of the same migration.
CREATE TABLE "historial_ordenes_compra" (
    "id" SERIAL NOT NULL,
    "ordenCompraId" INTEGER NOT NULL,
    "estadoAnterior" "EstadoOrdenCompra",
    "estadoNuevo" "EstadoOrdenCompra" NOT NULL,
    "usuarioId" INTEGER,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoOrdenCompra_new" AS ENUM ('PENDIENTE_APROBACION', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'ENVIADA_PROVEEDOR', 'EN_RECEPCION', 'RECEPCION_PARCIAL', 'RECEPCION_COMPLETA', 'CERRADA', 'CANCELADA');
ALTER TABLE "ordenes_compra" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "ordenes_compra" ALTER COLUMN "estado" TYPE "EstadoOrdenCompra_new" USING ("estado"::text::"EstadoOrdenCompra_new");
ALTER TABLE "historial_ordenes_compra" ALTER COLUMN "estadoAnterior" TYPE "EstadoOrdenCompra_new" USING ("estadoAnterior"::text::"EstadoOrdenCompra_new");
ALTER TABLE "historial_ordenes_compra" ALTER COLUMN "estadoNuevo" TYPE "EstadoOrdenCompra_new" USING ("estadoNuevo"::text::"EstadoOrdenCompra_new");
ALTER TYPE "EstadoOrdenCompra" RENAME TO "EstadoOrdenCompra_old";
ALTER TYPE "EstadoOrdenCompra_new" RENAME TO "EstadoOrdenCompra";
DROP TYPE "EstadoOrdenCompra_old";
ALTER TABLE "ordenes_compra" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE_APROBACION';
COMMIT;

-- AlterTable
ALTER TABLE "desempeno_proveedores" ALTER COLUMN "puntajeCumplimiento" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "puntajePrecio" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "puntajeTotal" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "devoluciones" ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "factura_detalles" ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "precioUnitario" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "facturas" ALTER COLUMN "monto" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "igv" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "inventario" ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "stockMinimo" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "items_solicitud_cotizacion" ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "notificaciones" ADD COLUMN     "ordenCompraId" INTEGER;

-- AlterTable
ALTER TABLE "ofertas_proveedor" ALTER COLUMN "montoTotal" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "puntajeHistorial" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "puntajePlazo" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "puntajePrecio" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "puntajeTotal" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "orden_compra_detalles" ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "precioUnitario" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ordenes_compra" ADD COLUMN     "condicionesComerciales" TEXT,
ADD COLUMN     "fechaAprobacion" TIMESTAMP(3),
ADD COLUMN     "gerenteAprobadorId" INTEGER,
ADD COLUMN     "igv" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "justificacionRechazo" TEXT,
ADD COLUMN     "justificacionRevision" TEXT,
ADD COLUMN     "ofertaGanadoraId" INTEGER NOT NULL,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "solicitudCotizacionId" INTEGER NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE_APROBACION',
ALTER COLUMN "montoTotal" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "pagos" ALTER COLUMN "monto" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "recepcion_detalles" ALTER COLUMN "cantidadEsperada" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "cantidadRecibida" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_googleId_key" ON "usuarios"("googleId");

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_solicitudCotizacionId_fkey" FOREIGN KEY ("solicitudCotizacionId") REFERENCES "solicitudes_cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_ofertaGanadoraId_fkey" FOREIGN KEY ("ofertaGanadoraId") REFERENCES "ofertas_proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_gerenteAprobadorId_fkey" FOREIGN KEY ("gerenteAprobadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_ordenes_compra" ADD CONSTRAINT "historial_ordenes_compra_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_ordenes_compra" ADD CONSTRAINT "historial_ordenes_compra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
