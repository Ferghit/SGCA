-- Preserve the order-detail lineage for every new reception line.
ALTER TABLE "recepcion_detalles" ADD COLUMN "ordenCompraDetalleId" INTEGER;

ALTER TABLE "recepcion_detalles"
ADD CONSTRAINT "recepcion_detalles_ordenCompraDetalleId_fkey"
FOREIGN KEY ("ordenCompraDetalleId") REFERENCES "orden_compra_detalles"("id")
ON DELETE SET NULL ON UPDATE CASCADE;