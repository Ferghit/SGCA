'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRequerimientosStore } from '@/store/requerimientosStore';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card, StatCard } from '@/components/ui/Card';
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
  Package,
  ArrowUpDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const {
    inventario,
    movimientos,
    fetchInventario,
    fetchMovimientos,
    fetchRecepciones,
    fetchOrdenesPendientes,
  } = useAlmacenStore();

  const isTrabajador = user?.rol === 'TRABAJADOR';
  const isJefe = user?.rol === 'JEFE_AREA' || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';
  const isAlmacen = user?.rol === 'ENCARGADO_ALMACEN';
  const canViewInventory = isAlmacen || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';

  useEffect(() => {
    fetchAll();
    if (isTrabajador) fetchEstadisticasTrabajador();
    if (isJefe) fetchEstadisticasJefe();
    if (canViewInventory) {
      fetchInventario();
      fetchMovimientos();
      fetchRecepciones();
      fetchOrdenesPendientes();
    }
  }, []);

  const recentReqs = requerimientos.slice(0, 5);

  // Prepare chart data for inventory
  const chartData = inventario.map(item => ({
    name: item.producto.nombre.length > 20 ? item.producto.nombre.substring(0, 20) + '...' : item.producto.nombre,
    cantidad: Number(item.cantidad),
    stockMinimo: Number(item.stockMinimo)
  }));

  const COLORS = ['#006D77', '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C'];

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

      {/* Inventory Section */}
      {canViewInventory && (
        <>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-primary-DEFAULT">Inventario</h2>
            <Link
              href="/inventario"
              className="flex items-center gap-1 text-sm font-medium text-secondary-DEFAULT hover:text-secondary-700 transition-colors"
              style={{ color: '#006D77' }}
            >
              Ver detalles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Productos en stock" value={inventario.length} icon={Package} color="secondary" />
            <StatCard 
              label="Alertas de stock bajo" 
              value={inventario.filter(i => i.stockBajo).length} 
              icon={AlertTriangle} 
              color="red" 
            />
            <StatCard label="Movimientos recientes" value={movimientos.length} icon={ArrowUpDown} color="blue" />
          </div>

          {/* Stock Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Stock actual por producto">
              {inventario.length === 0 ? (
                <p className="text-sm text-gray-400">No hay productos en inventario</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                      <Bar dataKey="cantidad" name="Cantidad actual" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.cantidad < entry.stockMinimo ? '#FF6B6B' : COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="stockMinimo" name="Stock mínimo" fill="#E0E0E0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Historial de movimientos">
              {movimientos.length === 0 ? (
                <p className="text-sm text-gray-400">Sin movimientos aún</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {movimientos.slice(0, 10).map((m, idx) => (
                    <div 
                      key={idx} 
                      className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0"
                    >
                      <span>{m.producto} — <span className="text-gray-400">{m.referencia}</span></span>
                      <span 
                        className={m.tipo === 'ENTRADA' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}
                      >
                        {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Inventory Table */}
          <Card title="Detalles del stock">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-3 px-4 font-semibold">Producto</th>
                    <th className="py-3 px-4 font-semibold">Cantidad</th>
                    <th className="py-3 px-4 font-semibold">Stock mínimo</th>
                    <th className="py-3 px-4 font-semibold">Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((i) => (
                    <tr key={i.id} className="border-b border-gray-50">
                      <td className="py-3 px-4">{i.producto.nombre}</td>
                      <td className={i.stockBajo ? 'text-red-600 font-medium py-3 px-4' : 'py-3 px-4'}>
                        {i.cantidad}
                      </td>
                      <td className="py-3 px-4">{i.stockMinimo}</td>
                      <td className="py-3 px-4">{i.ubicacion ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
