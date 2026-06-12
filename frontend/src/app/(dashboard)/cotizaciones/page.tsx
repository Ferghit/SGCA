'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCotizacionesStore } from '@/store/cotizacionesStore';
import { SolicitudCotizacion } from '@/types';
import Link from 'next/link';
import { Plus, Search, FileText, Clock, CheckCircle2, XCircle, Award } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

const ESTADO_CONFIG = {
  ABIERTA:    { label: 'Abierta',    color: 'bg-green-100 text-green-700',  icon: Clock },
  CERRADA:    { label: 'Cerrada',    color: 'bg-yellow-100 text-yellow-700', icon: XCircle },
  ADJUDICADA: { label: 'Adjudicada', color: 'bg-blue-100 text-blue-700',   icon: Award },
  CANCELADA:  { label: 'Cancelada',  color: 'bg-red-100 text-red-700',     icon: XCircle },
};

export default function CotizacionesPage() {
  const user = useAuthStore((s) => s.user);
  const { solicitudes, fetchSolicitudes, isLoading } = useCotizacionesStore();
  const [search, setSearch] = useState('');

  const isAnalista = user?.rol === 'ANALISTA_COMPRAS' || user?.rol === 'ADMIN';
  const isProveedor = user?.rol === 'PROVEEDOR';

  useEffect(() => { fetchSolicitudes(); }, []);

  const filtered = solicitudes.filter((s: SolicitudCotizacion) =>
    !search ||
    s.codigo.toLowerCase().includes(search.toLowerCase()) ||
    s.titulo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            {isProveedor ? 'Solicitudes Abiertas' : 'Solicitudes de Cotización'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} solicitud(es)</p>
        </div>
        {isAnalista && (
          <Link
            href="/cotizaciones/nueva"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors"
            style={{ backgroundColor: '#006D77' }}
          >
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay solicitudes de cotización</p>
          {isAnalista && (
            <Link href="/cotizaciones/nueva" className="mt-3 inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#006D77' }}>
              <Plus className="w-4 h-4" /> Crear la primera
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sol: SolicitudCotizacion) => {
            const cfg = ESTADO_CONFIG[sol.estado];
            const vencida = new Date(sol.fechaLimite) < new Date() && sol.estado === 'ABIERTA';
            return (
              <Link
                key={sol.id}
                href={isProveedor ? `/cotizaciones/${sol.id}/oferta` : `/cotizaciones/${sol.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: '#E8F4F5', color: '#006D77' }}>
                        {sol.codigo}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {vencida && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Plazo vencido
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1.5 truncate">{sol.titulo}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Req: {sol.requerimiento?.codigo} · {sol.items?.length} ítem(s) ·{' '}
                      {sol.ofertas?.length} oferta(s)
                    </p>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className="text-gray-500 text-xs">Fecha límite</p>
                    <p className={`font-medium ${vencida ? 'text-red-600' : 'text-gray-700'}`}>
                      {formatDateShort(sol.fechaLimite)}
                    </p>
                  </div>
                </div>
                {sol.proveedorGanador && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#006D77' }}>
                    <Award className="w-3.5 h-3.5" />
                    Ganador: {sol.proveedorGanador.razonSocial}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}