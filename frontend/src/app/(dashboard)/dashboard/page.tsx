'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRequerimientosStore } from '@/store/requerimientosStore';
import { StatCard } from '@/components/ui/Card';
import { EstadoBadge, PrioridadBadge } from '@/components/ui/Badge';
import { ROL_LABELS, formatDateShort } from '@/lib/utils';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  FileEdit,
} from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const {
    requerimientos,
    estadisticasTrabajador,
    estadisticasJefe,
    fetchAll,
    fetchEstadisticasTrabajador,
    fetchEstadisticasJefe,
    isLoading,
  } = useRequerimientosStore();

  const isTrabajador = user?.rol === 'TRABAJADOR';
  const isJefe = user?.rol === 'JEFE_AREA' || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';

  useEffect(() => {
    fetchAll();
    if (isTrabajador) fetchEstadisticasTrabajador();
    if (isJefe) fetchEstadisticasJefe();
  }, []);

  const recentReqs = requerimientos.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-primary-DEFAULT to-secondary-DEFAULT rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1B263B, #006D77)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Bienvenido, {user?.nombre} {user?.apellido}
            </h1>
            <p className="text-white text-opacity-80 mt-1 text-sm">
              {ROL_LABELS[user?.rol || 'TRABAJADOR']} &bull; {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {isTrabajador && (
            <Link
              href="/requerimientos/nuevo"
              className="flex items-center gap-2 px-4 py-2 bg-white text-primary-DEFAULT font-semibold text-sm rounded-lg hover:bg-opacity-90 transition-colors"
              style={{ color: '#006D77' }}
            >
              <Plus className="w-4 h-4" />
              Nuevo Requerimiento
            </Link>
          )}
        </div>
      </div>

      {/* Estadisticas - Trabajador */}
      {isTrabajador && estadisticasTrabajador && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total" value={estadisticasTrabajador.total} icon={ClipboardList} color="primary" />
          <StatCard label="Borradores" value={estadisticasTrabajador.borrador} icon={FileEdit} color="blue" />
          <StatCard label="Pendientes" value={estadisticasTrabajador.pendiente} icon={Clock} color="amber" />
          <StatCard label="Aprobados" value={estadisticasTrabajador.aprobado} icon={CheckCircle} color="green" />
          <StatCard label="Rechazados" value={estadisticasTrabajador.rechazado} icon={XCircle} color="red" />
          <StatCard label="En Revision" value={estadisticasTrabajador.enRevision} icon={AlertTriangle} color="accent" />
        </div>
      )}

      {/* Estadisticas - Jefe de Area */}
      {isJefe && estadisticasJefe && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Reqs." value={estadisticasJefe.total} icon={ClipboardList} color="primary" />
          <StatCard label="Pendientes" value={estadisticasJefe.pendientes} icon={Clock} color="amber" />
          <StatCard label="Aprobados" value={estadisticasJefe.aprobados} icon={CheckCircle} color="green" />
          <StatCard label="Rechazados" value={estadisticasJefe.rechazados} icon={XCircle} color="red" />
          <StatCard label="En Revision" value={estadisticasJefe.enRevision} icon={AlertTriangle} color="accent" />
        </div>
      )}

      {/* Tabla de requerimientos recientes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-primary-DEFAULT">
              {isJefe ? 'Requerimientos Recientes' : 'Mis Requerimientos Recientes'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Ultimos 5 registros</p>
          </div>
          <Link
            href="/requerimientos"
            className="flex items-center gap-1 text-sm font-medium text-secondary-DEFAULT hover:text-secondary-700 transition-colors"
            style={{ color: '#006D77' }}
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-secondary-DEFAULT border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
          </div>
        ) : recentReqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay requerimientos registrados</p>
            {isTrabajador && (
              <Link href="/requerimientos/nuevo" className="mt-3 text-sm font-medium text-secondary-DEFAULT hover:underline" style={{ color: '#006D77' }}>
                Crear el primero
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">Codigo</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Estado</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Prioridad</th>
                  {isJefe && <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Solicitante</th>}
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Fecha Req.</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentReqs.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-sm font-semibold text-primary-DEFAULT">{req.codigo}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <EstadoBadge estado={req.estado} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <PrioridadBadge prioridad={req.prioridad} size="sm" />
                    </td>
                    {isJefe && (
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {req.solicitante.nombre} {req.solicitante.apellido}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-sm text-gray-500">
                      {formatDateShort(req.fechaRequerida)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/requerimientos/${req.id}`}
                        className="text-xs font-medium text-secondary-DEFAULT hover:underline"
                        style={{ color: '#006D77' }}
                      >
                        Ver detalle
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
