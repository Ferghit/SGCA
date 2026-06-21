'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { EstadoOCBadge } from '@/components/ui/Badge';
import { EstadoOrdenCompra, OrdenCompra } from '@/types';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { ordenesCompraApi } from '@/lib/api';

const ESTADOS_OC: EstadoOrdenCompra[] = [
  'PENDIENTE_APROBACION',
  'EN_REVISION',
  'APROBADA',
  'RECHAZADA',
  'ENVIADA_PROVEEDOR',
  'EN_RECEPCION',
  'RECEPCION_PARCIAL',
  'RECEPCION_COMPLETA',
  'CERRADA',
  'CANCELADA',
];

export default function OrdenesCompraPage() {
  const user = useAuthStore((s) => s.user);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoOrdenCompra | ''>('');

  const isGerente = ['GERENTE', 'ADMIN'].includes(user?.rol || '');
  const isProveedor = user?.rol === 'PROVEEDOR';
  const isAnalista = ['ANALISTA_COMPRAS', 'ADMIN'].includes(user?.rol || '');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await ordenesCompraApi.getAll();
        setOrdenes(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = ordenes.filter((oc) => {
    const matchSearch =
      !search ||
      oc.numero.toLowerCase().includes(search.toLowerCase()) ||
      oc.proveedor.razonSocial.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || oc.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            {isProveedor ? 'Mis Ordenes de Compra' : 'Ordenes de Compra'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} orden{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por numero o proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            />
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as EstadoOrdenCompra | '')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white text-gray-600"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_OC.map((e) => (
              <option key={e} value={e}>
                {e.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-14 h-14 mb-4 opacity-20" />
            <p className="font-medium text-gray-500">No se encontraron ordenes de compra</p>
            <p className="text-sm mt-1">
              {search || filterEstado ? 'Intenta ajustar los filtros de busqueda' : 'No hay ordenes de compra registradas'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3.5 uppercase tracking-wide">Numero</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Proveedor</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Estado</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Fecha Emision</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Monto Total</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3.5 uppercase tracking-wide">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((oc) => (
                  <tr key={oc.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold" style={{ color: '#1B263B' }}>{oc.numero}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {oc.proveedor.razonSocial}
                    </td>
                    <td className="px-4 py-4">
                      <EstadoOCBadge estado={oc.estado} size="sm" />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDateShort(oc.fechaEmision)}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-700">
                      {formatCurrency(oc.montoTotal)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/ordenes-compra/${oc.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors group-hover:border-secondary-DEFAULT group-hover:text-secondary-DEFAULT"
                        style={{ color: '#006D77', borderColor: 'currentColor' }}
                      >
                        Ver detalle
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
