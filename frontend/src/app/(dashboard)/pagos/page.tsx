'use client';

import { useEffect, useState } from 'react';
import { CreditCard, FileText, Search } from 'lucide-react';
import { contabilidadApi } from '@/lib/api';
import { Card, StatCard } from '@/components/ui/Card';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import type { Factura, Pago } from '@/types';

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [pagosData, facturasData] = await Promise.all([
          contabilidadApi.getPagos(),
          contabilidadApi.getFacturas(),
        ]);
        setPagos(pagosData);
        setFacturas(facturasData);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const pendientes = facturas.filter((factura) => factura.estadoPago === 'PENDIENTE');
  const observadas = facturas.filter((factura) => factura.estadoPago === 'OBSERVADO');
  const montoProcesado = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);

  const filteredPagos = pagos.filter((pago) => {
    const query = search.toLowerCase();
    return !query || pago.factura?.numero.toLowerCase().includes(query) || pago.factura?.proveedor.razonSocial.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Pagos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Seguimiento de pagos procesados, pendientes y observados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Pagos procesados" value={pagos.length} icon={CreditCard} color="green" trend={formatCurrency(montoProcesado)} />
        <StatCard label="Facturas pendientes" value={pendientes.length} icon={FileText} color="amber" />
        <StatCard label="Facturas observadas" value={observadas.length} icon={FileText} color="red" />
      </div>

      <Card title="Pagos registrados" action={
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Buscar pago" />
        </div>
      }>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-gray-500">Cargando pagos...</div>
        ) : filteredPagos.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">No hay pagos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-3 font-semibold">Factura</th>
                  <th className="py-3 px-3 font-semibold">Proveedor</th>
                  <th className="py-3 px-3 font-semibold">Fecha</th>
                  <th className="py-3 px-3 font-semibold">Metodo</th>
                  <th className="py-3 px-3 font-semibold">Referencia</th>
                  <th className="py-3 px-3 font-semibold text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPagos.map((pago) => (
                  <tr key={pago.id}>
                    <td className="py-3 px-3 font-semibold text-gray-800">{pago.factura?.numero}</td>
                    <td className="py-3 px-3 text-gray-700">{pago.factura?.proveedor.razonSocial}</td>
                    <td className="py-3 px-3 text-gray-500">{formatDateShort(pago.fechaPago)}</td>
                    <td className="py-3 px-3">{pago.metodoPago}</td>
                    <td className="py-3 px-3 font-mono text-xs">{pago.referencia || '-'}</td>
                    <td className="py-3 px-3 text-right font-semibold">{formatCurrency(pago.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Facturas con pago pendiente u observado">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b border-gray-100">
              <tr>
                <th className="py-3 px-3 font-semibold">Factura</th>
                <th className="py-3 px-3 font-semibold">Proveedor</th>
                <th className="py-3 px-3 font-semibold">Estado pago</th>
                <th className="py-3 px-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...pendientes, ...observadas].map((factura) => (
                <tr key={factura.id}>
                  <td className="py-3 px-3 font-semibold">{factura.numero}</td>
                  <td className="py-3 px-3">{factura.proveedor.razonSocial}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${factura.estadoPago === 'OBSERVADO' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      {factura.estadoPago}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold">{formatCurrency(factura.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
