'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Plus, RefreshCw, Search } from 'lucide-react';
import { contabilidadApi } from '@/lib/api';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Card, StatCard } from '@/components/ui/Card';
import type { Factura, OrdenCompra, TipoIncidencia } from '@/types';

type DetalleForm = {
  productoId?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

const emptyDetalle: DetalleForm = { descripcion: '', cantidad: 1, precioUnitario: 0 };

export default function FacturasPage() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [selectedOrdenId, setSelectedOrdenId] = useState('');
  const [numero, setNumero] = useState('');
  const [fechaEmision, setFechaEmision] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [detalles, setDetalles] = useState<DetalleForm[]>([emptyDetalle]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [incidencia, setIncidencia] = useState({ proveedorId: '', ordenCompraId: '', tipo: 'RECLAMO' as TipoIncidencia, descripcion: '', impacto: 2 });

  const selectedOrden = ordenes.find((orden) => orden.id === Number(selectedOrdenId));

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordenesData, facturasData] = await Promise.all([
        contabilidadApi.getOrdenesParaFacturar(),
        contabilidadApi.getFacturas(),
      ]);
      setOrdenes(ordenesData);
      setFacturas(facturasData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedOrden) return;
    setDetalles(selectedOrden.detalles.map((detalle) => ({
      productoId: detalle.productoId,
      descripcion: detalle.descripcion,
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precioUnitario),
    })));
    setIncidencia((prev) => ({
      ...prev,
      proveedorId: String(selectedOrden.proveedorId),
      ordenCompraId: String(selectedOrden.id),
    }));
  }, [selectedOrdenId]);

  const totals = useMemo(() => {
    const subtotal = detalles.reduce((sum, item) => sum + Number(item.cantidad || 0) * Number(item.precioUnitario || 0), 0);
    const igv = subtotal * 0.18;
    return { subtotal, igv, total: subtotal + igv };
  }, [detalles]);

  const filteredFacturas = facturas.filter((factura) => {
    const query = search.toLowerCase();
    return !query || factura.numero.toLowerCase().includes(query) || factura.proveedor.razonSocial.toLowerCase().includes(query);
  });

  const stats = {
    total: facturas.length,
    conformes: facturas.filter((f) => f.estadoCruce === 'CONFORME').length,
    observadas: facturas.filter((f) => f.estadoCruce === 'OBSERVADA').length,
    pendientesPago: facturas.filter((f) => f.estadoPago === 'PENDIENTE').length,
  };

  const submitFactura = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!selectedOrdenId) {
      setError('Selecciona una orden de compra');
      return;
    }
    setIsSaving(true);
    try {
      const created = await contabilidadApi.crearFactura({
        numero,
        ordenCompraId: Number(selectedOrdenId),
        fechaEmision,
        fechaVencimiento: fechaVencimiento || undefined,
        detalles,
      });
      setFacturas((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setNumero('');
      setSelectedOrdenId('');
      setDetalles([emptyDetalle]);
      setFechaVencimiento('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo registrar la factura');
    } finally {
      setIsSaving(false);
    }
  };

  const updateDetalle = (index: number, patch: Partial<DetalleForm>) => {
    setDetalles((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const actualizarPago = async (factura: Factura, estado: 'PENDIENTE' | 'PROCESADO' | 'OBSERVADO') => {
    const updated = await contabilidadApi.actualizarPago(factura.id, {
      estado,
      monto: Number(factura.total),
      metodoPago: estado === 'PROCESADO' ? 'Transferencia bancaria' : undefined,
      referencia: estado === 'PROCESADO' ? `PAGO-${factura.numero}` : undefined,
    });
    setFacturas((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const registrarIncidencia = async (event: FormEvent) => {
    event.preventDefault();
    await contabilidadApi.crearIncidencia({
      proveedorId: Number(incidencia.proveedorId),
      ordenCompraId: incidencia.ordenCompraId ? Number(incidencia.ordenCompraId) : undefined,
      tipo: incidencia.tipo,
      descripcion: incidencia.descripcion,
      impacto: incidencia.impacto,
    });
    setIncidencia((prev) => ({ ...prev, descripcion: '', impacto: 2 }));
    await loadData();
  };

  const descargarPdf = async (factura: Factura) => {
    const blob = await contabilidadApi.getFacturaPdf(factura.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${factura.numero}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Contabilidad - Facturas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Carga de facturas, cruce de tres vias y control de pagos</p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Facturas" value={stats.total} icon={FileText} color="primary" />
        <StatCard label="Cruce conforme" value={stats.conformes} icon={CheckCircle2} color="green" />
        <StatCard label="Observadas" value={stats.observadas} icon={AlertTriangle} color="red" />
        <StatCard label="Pago pendiente" value={stats.pendientesPago} icon={FileText} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card title="Registrar factura del proveedor" subtitle="El sistema compara OC, guia de remision y factura al guardar">
          <form onSubmit={submitFactura} className="space-y-4">
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="block font-medium text-gray-700 mb-1">Orden de compra</span>
                <select value={selectedOrdenId} onChange={(e) => setSelectedOrdenId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">Seleccionar OC</option>
                  {ordenes.map((orden) => (
                    <option key={orden.id} value={orden.id}>
                      {orden.numero} - {orden.proveedor.razonSocial}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="block font-medium text-gray-700 mb-1">Numero de factura</span>
                <input value={numero} onChange={(e) => setNumero(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="F001-000123" />
              </label>
              <label className="text-sm">
                <span className="block font-medium text-gray-700 mb-1">Fecha emision</span>
                <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block font-medium text-gray-700 mb-1">Fecha vencimiento</span>
                <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Detalle facturado</p>
                <button type="button" onClick={() => setDetalles((prev) => [...prev, emptyDetalle])} className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#006D77' }}>
                  <Plus className="w-4 h-4" />
                  Agregar item
                </button>
              </div>

              {detalles.map((detalle, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px] gap-2">
                  <input value={detalle.descripcion} onChange={(e) => updateDetalle(index, { descripcion: e.target.value })} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Descripcion" />
                  <input type="number" min="0.01" step="0.01" value={detalle.cantidad} onChange={(e) => updateDetalle(index, { cantidad: Number(e.target.value) })} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" min="0" step="0.01" value={detalle.precioUnitario} onChange={(e) => updateDetalle(index, { precioUnitario: Number(e.target.value) })} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-600">
                Subtotal {formatCurrency(totals.subtotal)} &bull; IGV {formatCurrency(totals.igv)} &bull; <span className="font-semibold text-gray-800">Total {formatCurrency(totals.total)}</span>
              </div>
              <button disabled={isSaving} className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: '#006D77' }}>
                {isSaving ? 'Guardando...' : 'Guardar y cruzar'}
              </button>
            </div>
          </form>
        </Card>

        <Card title="Registrar incidencia" subtitle="Reclamos, devoluciones o incumplimientos afectan el desempeno">
          <form onSubmit={registrarIncidencia} className="space-y-3">
            <select value={incidencia.proveedorId} onChange={(e) => setIncidencia((prev) => ({ ...prev, proveedorId: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm">
              <option value="">Proveedor</option>
              {ordenes.map((orden) => (
                <option key={orden.id} value={orden.proveedorId}>{orden.proveedor.razonSocial}</option>
              ))}
            </select>
            <select value={incidencia.tipo} onChange={(e) => setIncidencia((prev) => ({ ...prev, tipo: e.target.value as TipoIncidencia }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm">
              <option value="RECLAMO">Reclamo</option>
              <option value="DEVOLUCION">Devolucion</option>
              <option value="INCUMPLIMIENTO">Incumplimiento</option>
            </select>
            <textarea value={incidencia.descripcion} onChange={(e) => setIncidencia((prev) => ({ ...prev, descripcion: e.target.value }))} required rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Descripcion de la incidencia" />
            <label className="block text-sm">
              <span className="block font-medium text-gray-700 mb-1">Impacto: {incidencia.impacto}</span>
              <input type="range" min="1" max="5" value={incidencia.impacto} onChange={(e) => setIncidencia((prev) => ({ ...prev, impacto: Number(e.target.value) }))} className="w-full" />
            </label>
            <button className="w-full px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#1B263B' }}>Registrar incidencia</button>
          </form>
        </Card>
      </div>

      <Card title="Facturas registradas" action={
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Buscar factura" />
        </div>
      }>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-gray-500">Cargando facturas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-3 font-semibold">Factura</th>
                  <th className="py-3 px-3 font-semibold">Proveedor</th>
                  <th className="py-3 px-3 font-semibold">OC</th>
                  <th className="py-3 px-3 font-semibold">Cruce</th>
                  <th className="py-3 px-3 font-semibold">Pago</th>
                  <th className="py-3 px-3 font-semibold">Total</th>
                  <th className="py-3 px-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFacturas.map((factura) => (
                  <tr key={factura.id}>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-800">{factura.numero}</div>
                      <div className="text-xs text-gray-400">{formatDateShort(factura.fechaEmision)}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">{factura.proveedor.razonSocial}</td>
                    <td className="py-3 px-3 font-mono text-xs">{factura.ordenCompra?.numero || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${factura.estadoCruce === 'CONFORME' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {factura.estadoCruce}
                      </span>
                      {factura.observacionesCruce && <p className="text-xs text-red-600 mt-1 max-w-xs">{factura.observacionesCruce}</p>}
                    </td>
                    <td className="py-3 px-3">
                      <select value={factura.estadoPago} onChange={(e) => actualizarPago(factura, e.target.value as any)} className="border border-gray-200 rounded-lg px-2 py-1 bg-white text-xs">
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="PROCESADO">Procesado</option>
                        <option value="OBSERVADO">Observado</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 font-semibold">{formatCurrency(factura.total)}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => descargarPdf(factura)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ color: '#006D77', borderColor: '#006D77' }}>
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
