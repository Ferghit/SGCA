'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRequerimientosStore } from '@/store/requerimientosStore';
import { EstadoBadge, PrioridadBadge } from '@/components/ui/Badge';
import { EstadoRequerimiento, Prioridad, Requerimiento } from '@/types';
import { formatDateShort } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, Filter, ClipboardList, ChevronRight } from 'lucide-react';

const ESTADOS: EstadoRequerimiento[] = ['BORRADOR', 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_REVISION'];
const PRIORIDADES: Prioridad[] = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

export default function RequerimientosPage() {
  const user = useAuthStore((s) => s.user);
  const { requerimientos, fetchAll, fetchPendientes, isLoading } = useRequerimientosStore();

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoRequerimiento | ''>('');
  const [filterPrioridad, setFilterPrioridad] = useState<Prioridad | ''>('');

  const isJefe = ['JEFE_AREA', 'ADMIN', 'GERENTE', 'ANALISTA_COMPRAS'].includes(user?.rol || '');
  const isTrabajador = user?.rol === 'TRABAJADOR';
  const canCreateRequerimiento = ['TRABAJADOR', 'ADMIN', 'ANALISTA_COMPRAS'].includes(user?.rol || '');

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = requerimientos.filter((r: Requerimiento) => {
    const matchSearch =
      !search ||
      r.codigo.toLowerCase().includes(search.toLowerCase()) ||
      r.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
      `${r.solicitante.nombre} ${r.solicitante.apellido}`.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || r.estado === filterEstado;
    const matchPrioridad = !filterPrioridad || r.prioridad === filterPrioridad;
    return matchSearch && matchEstado && matchPrioridad;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            {isJefe ? 'Requerimientos' : 'Mis Requerimientos'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} requerimiento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreateRequerimiento && (
          <Link
            href="/requerimientos/nuevo"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors"
            style={{ backgroundColor: '#006D77' }}
          >
            <Plus className="w-4 h-4" />
            Nuevo Requerimiento
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por codigo, descripcion o solicitante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            />
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as EstadoRequerimiento | '')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white text-gray-600"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={filterPrioridad}
            onChange={(e) => setFilterPrioridad(e.target.value as Prioridad | '')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white text-gray-600"
          >
            <option value="">Todas las prioridades</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{p}</option>
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
            <ClipboardList className="w-14 h-14 mb-4 opacity-20" />
            <p className="font-medium text-gray-500">No se encontraron requerimientos</p>
            <p className="text-sm mt-1">
              {search || filterEstado || filterPrioridad
                ? 'Intenta ajustar los filtros de busqueda'
                : isTrabajador
                ? 'Crea tu primer requerimiento'
                : 'No hay requerimientos registrados'}
            </p>
            {canCreateRequerimiento && !search && !filterEstado && !filterPrioridad && (
              <Link href="/requerimientos/nuevo" className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#006D77' }}>
                Nuevo Requerimiento
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3.5 uppercase tracking-wide">Codigo</th>
                  {isJefe && <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Solicitante</th>}
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Estado</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Prioridad</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Fecha Req.</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Descripcion</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3.5 uppercase tracking-wide">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((req: Requerimiento) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-primary-DEFAULT" style={{ color: '#1B263B' }}>
                        {req.codigo}
                      </span>
                    </td>
                    {isJefe && (
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {req.solicitante.nombre} {req.solicitante.apellido}
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <EstadoBadge estado={req.estado} size="sm" />
                    </td>
                    <td className="px-4 py-4">
                      <PrioridadBadge prioridad={req.prioridad} size="sm" />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDateShort(req.fechaRequerida)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {req.descripcion || <span className="italic text-gray-300">Sin descripcion</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/requerimientos/${req.id}`}
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
