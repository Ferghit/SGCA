'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRequerimientosStore } from '@/store/requerimientosStore';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card, StatCard } from '@/components/ui/Card';
import { EstadoBadge, PrioridadBadge, EstadoOCBadge } from '@/components/ui/Badge';
import { ROL_LABELS, formatDateOnly, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  FileText,
  Layers,
  DollarSign,
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
  ShoppingCart,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import api, { contabilidadApi, usersApi, ordenesCompraApi } from '@/lib/api';
import { OrdenCompra } from '@/types';

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

  const [ordenesProveedor, setOrdenesProveedor] = useState<OrdenCompra[]>([]);
  const [isLoadingOC, setIsLoadingOC] = useState(false);

  // States for other roles
  const [solicitudesCotizacion, setSolicitudesCotizacion] = useState<any[]>([]);
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [ofertasProveedor, setOfertasProveedor] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const rol = user?.rol;
  const isTrabajador = rol === 'TRABAJADOR';
  const isJefe = rol === 'JEFE_AREA' || rol === 'ADMIN' || rol === 'GERENTE';
  const isAlmacen = rol === 'ENCARGADO_ALMACEN';
  const isProveedor = rol === 'PROVEEDOR';
  const canViewInventory = isAlmacen || rol === 'ADMIN' || rol === 'GERENTE';

  useEffect(() => {
    if (!rol) return;

    const loadDashboardData = async () => {
      setLoadingExtra(true);
      try {
        const promises: Promise<any>[] = [];

        // 1. Requerimientos
        const needsRequerimientos = ['TRABAJADOR', 'JEFE_AREA', 'ADMIN', 'GERENTE'].includes(rol);
        if (needsRequerimientos) {
          promises.push(fetchAll());
          if (rol === 'TRABAJADOR') promises.push(fetchEstadisticasTrabajador());
          if (['JEFE_AREA', 'ADMIN', 'GERENTE'].includes(rol)) promises.push(fetchEstadisticasJefe());
        }

        // 2. Inventario/Almacén
        const needsAlmacen = ['ENCARGADO_ALMACEN', 'ADMIN', 'GERENTE'].includes(rol);
        if (needsAlmacen) {
          promises.push(fetchInventario());
          promises.push(fetchMovimientos());
          promises.push(fetchRecepciones());
          promises.push(fetchOrdenesPendientes());
        }

        // 3. Proveedor
        if (rol === 'PROVEEDOR') {
          setIsLoadingOC(true);
          promises.push(
            ordenesCompraApi.getAll().then((data) => {
              const abiertas = data.filter(
                (oc) => !['CERRADA', 'CANCELADA', 'RECHAZADA'].includes(oc.estado)
              );
              setOrdenesProveedor(abiertas);
              setOrdenesCompra(data);
              setIsLoadingOC(false);
            }).catch(() => setIsLoadingOC(false))
          );
          promises.push(
            api.get('/cotizaciones/mis-ofertas').then(({ data }) => {
              setOfertasProveedor(data);
            })
          );
        }

        // 4. Analista de Compras
        if (rol === 'ANALISTA_COMPRAS') {
          promises.push(
            api.get('/cotizaciones/solicitudes').then(({ data }) => {
              setSolicitudesCotizacion(data);
            })
          );
          promises.push(
            ordenesCompraApi.getAll().then((data) => {
              setOrdenesCompra(data);
            })
          );
        }

        // 5. Gerente
        if (rol === 'GERENTE') {
          promises.push(
            ordenesCompraApi.getAll().then((data) => {
              setOrdenesCompra(data);
            })
          );
        }

        // 6. Contador
        if (rol === 'CONTADOR') {
          promises.push(
            contabilidadApi.getFacturas().then((data) => {
              setFacturas(data);
            })
          );
          promises.push(
            contabilidadApi.getPagos().then((data) => {
              setPagos(data);
            })
          );
        }

        // 7. Admin
        if (rol === 'ADMIN') {
          promises.push(
            usersApi.getAll().then((data) => {
              setUsuarios(data);
            })
          );
          promises.push(
            ordenesCompraApi.getAll().then((data) => {
              setOrdenesCompra(data);
            })
          );
        }

        await Promise.all(promises);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoadingExtra(false);
      }
    };

    loadDashboardData();
  }, [rol, fetchAll, fetchEstadisticasTrabajador, fetchEstadisticasJefe, fetchInventario, fetchMovimientos, fetchRecepciones, fetchOrdenesPendientes]);

  const recentReqs = requerimientos.slice(0, 5);

  const chartData = inventario.map((item) => ({
    name: item.producto?.nombre
      ? item.producto.nombre.length > 18
        ? item.producto.nombre.substring(0, 18) + '...'
        : item.producto.nombre
      : 'Producto',
    cantidad: Number(item.cantidad),
    stockMinimo: Number(item.stockMinimo),
  }));

  const COLORS = ['#006D77', '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C'];
  const PIE_COLORS = ['#006D77', '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#83C5BE', '#FFDDD2', '#E29578'];

  const ESTADO_REQ_LABELS: Record<string, string> = {
    BORRADOR: 'Borrador',
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado Jefe',
    APROBADO_GERENTE: 'Aprobado Gerente',
    RECHAZADO: 'Rechazado',
    EN_REVISION: 'En Revisión',
  };

  const ESTADO_OC_LABELS: Record<string, string> = {
    PENDIENTE_APROBACION: 'P. Aprobación',
    EN_REVISION: 'En Revisión',
    APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada',
    ENVIADA_PROVEEDOR: 'Env. Proveedor',
    EN_RECEPCION: 'En Recepción',
    RECEPCION_PARCIAL: 'Rec. Parcial',
    RECEPCION_COMPLETA: 'Rec. Completa',
    CERRADA: 'Cerrada',
    CANCELADA: 'Cancelada',
  };

  const ESTADO_COT_LABELS: Record<string, string> = {
    BORRADOR: 'Borrador',
    ABIERTA: 'Abierta',
    CERRADA: 'Cerrada',
    ADJUDICADA: 'Adjudicada',
    CANCELADA: 'Cancelada',
  };

  const ESTADO_OFERTA_LABELS: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    ENVIADA: 'Enviada',
    GANADORA: 'Ganadora',
    RECHAZADA: 'Rechazada',
  };

  const getPieChartData = (items: any[], key: string, labelMap: Record<string, string>) => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const val = item[key];
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return Object.keys(counts).map((k) => ({
      name: labelMap[k] || k,
      value: counts[k],
    }));
  };

  const renderPieChart = (data: any[], title: string) => {
    if (data.length === 0) {
      return (
        <Card title={title}>
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            No hay datos para mostrar
          </div>
        </Card>
      );
    }
    return (
      <Card title={title}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} registro(s)`, 'Cantidad']} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  };

  const renderRecentRequerimientosTable = (showSolicitante: boolean) => {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-primary-DEFAULT">
              Requerimientos Recientes
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Últimos 5 registros</p>
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

        {recentReqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay requerimientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left text-gray-500 font-semibold">
                  <th className="px-6 py-3 uppercase tracking-wide text-xs">Código</th>
                  <th className="px-4 py-3 uppercase tracking-wide text-xs">Estado</th>
                  <th className="px-4 py-3 uppercase tracking-wide text-xs">Prioridad</th>
                  {showSolicitante && <th className="px-4 py-3 uppercase tracking-wide text-xs">Solicitante</th>}
                  <th className="px-4 py-3 uppercase tracking-wide text-xs">Fecha Req.</th>
                  <th className="px-6 py-3 text-right uppercase tracking-wide text-xs">Acción</th>
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
                    {showSolicitante && (
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {req.solicitante.nombre} {req.solicitante.apellido}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-sm text-gray-500">
                      {formatDateOnly(req.fechaRequerida)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/requerimientos/${req.id}`}
                        className="text-xs font-semibold hover:underline"
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
    );
  };

  const renderRecentMovementsCard = () => {
    return (
      <Card title="Historial de movimientos de Almacén">
        {movimientos.length === 0 ? (
          <p className="text-sm text-gray-400">Sin movimientos registrados</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {movimientos.slice(0, 10).map((m, idx) => (
              <div key={idx} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0 hover:bg-gray-50 transition-colors p-1 rounded">
                <span>
                  <span className="font-semibold">{m.producto}</span> — <span className="text-gray-400 text-xs">{m.referencia}</span>
                </span>
                <span className={m.tipo === 'ENTRADA' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const renderInventoryDetailsTable = () => {
    return (
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
                <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{i.producto.nombre}</td>
                  <td className={i.stockBajo ? 'text-red-600 font-semibold py-3 px-4' : 'py-3 px-4 font-medium text-gray-700'}>
                    {i.cantidad}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{i.stockMinimo}</td>
                  <td className="py-3 px-4 text-gray-400">{i.ubicacion ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  // --- RENDER PER ROLE ---

  const renderAdminDashboard = () => {
    const totalCompras = ordenesCompra.reduce((acc, o) => acc + (Number(o.montoTotal) || 0), 0);
    const stockBajoAlerts = inventario.filter((i) => i.stockBajo).length;
    const reqPieData = getPieChartData(requerimientos, 'estado', ESTADO_REQ_LABELS);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Usuarios en Sistema" value={usuarios.length} icon={Users} color="primary" />
          <StatCard label="Productos Activos" value={inventario.length} icon={Package} color="secondary" />
          <StatCard label="Total Compras (S/)" value={formatCurrency(totalCompras)} icon={DollarSign} color="green" />
          <StatCard label="Alertas Stock Bajo" value={stockBajoAlerts} icon={AlertTriangle} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Stock actual por producto">
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400">No hay productos en inventario</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="cantidad" name="Cantidad actual" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cantidad < entry.stockMinimo ? '#FF6B6B' : COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="stockMinimo" name="Stock mínimo" fill="#E0E0E0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          {renderPieChart(reqPieData, 'Todos los Requerimientos por Estado')}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderRecentRequerimientosTable(true)}
          {renderRecentMovementsCard()}
        </div>
      </div>
    );
  };

  const renderTrabajadorDashboard = () => {
    const stats = estadisticasTrabajador || {
      total: 0,
      borrador: 0,
      pendiente: 0,
      aprobado: 0,
      rechazado: 0,
      enRevision: 0,
    };
    const myReqsPieData = getPieChartData(requerimientos, 'estado', ESTADO_REQ_LABELS);

    const reqsAltaUrgente = requerimientos.filter((r) => r.prioridad === 'ALTA' || r.prioridad === 'URGENTE').length;

    const barPrioridadData = [
      { name: 'Baja', cantidad: requerimientos.filter(r => r.prioridad === 'BAJA').length },
      { name: 'Media', cantidad: requerimientos.filter(r => r.prioridad === 'MEDIA').length },
      { name: 'Alta', cantidad: requerimientos.filter(r => r.prioridad === 'ALTA').length },
      { name: 'Urgente', cantidad: requerimientos.filter(r => r.prioridad === 'URGENTE').length }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <StatCard label="Total Reqs." value={stats.total} icon={ClipboardList} color="primary" />
          <StatCard label="Borradores" value={stats.borrador} icon={FileEdit} color="blue" />
          <StatCard label="Pendientes" value={stats.pendiente} icon={Clock} color="amber" />
          <StatCard label="Aprobados" value={stats.aprobado} icon={CheckCircle} color="green" />
          <StatCard label="Rechazados" value={stats.rechazado} icon={XCircle} color="red" />
          <StatCard label="En Revision" value={stats.enRevision} icon={AlertTriangle} color="accent" />
          <StatCard label="Alta/Urgente" value={reqsAltaUrgente} icon={AlertTriangle} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Mis Requerimientos por Prioridad">
            {barPrioridadData.every(d => d.cantidad === 0) ? (
              <p className="text-sm text-gray-400 py-12 text-center">No hay datos</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barPrioridadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="cantidad" name="Cantidad" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          {renderPieChart(myReqsPieData, 'Mis Requerimientos por Estado')}
        </div>

        <div className="w-full">
          {renderRecentRequerimientosTable(false)}
        </div>
      </div>
    );
  };

  const renderJefeDashboard = () => {
    const stats = estadisticasJefe || {
      total: 0,
      pendientes: 0,
      aprobados: 0,
      rechazados: 0,
      enRevision: 0,
    };
    const jefePieData = getPieChartData(requerimientos, 'estado', ESTADO_REQ_LABELS);
    
    const reqsAltaUrgente = requerimientos.filter((r) => r.prioridad === 'ALTA' || r.prioridad === 'URGENTE').length;

    const barPrioridadData = [
      { name: 'Baja', cantidad: requerimientos.filter(r => r.prioridad === 'BAJA').length },
      { name: 'Media', cantidad: requerimientos.filter(r => r.prioridad === 'MEDIA').length },
      { name: 'Alta', cantidad: requerimientos.filter(r => r.prioridad === 'ALTA').length },
      { name: 'Urgente', cantidad: requerimientos.filter(r => r.prioridad === 'URGENTE').length }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Reqs." value={stats.total} icon={ClipboardList} color="primary" />
          <StatCard label="Pendientes" value={stats.pendientes} icon={Clock} color="amber" />
          <StatCard label="Aprobados" value={stats.aprobados} icon={CheckCircle} color="green" />
          <StatCard label="Rechazados" value={stats.rechazados} icon={XCircle} color="red" />
          <StatCard label="En Revision" value={stats.enRevision} icon={AlertTriangle} color="accent" />
          <StatCard label="Alta/Urgente" value={reqsAltaUrgente} icon={AlertTriangle} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Requerimientos por Prioridad">
            {barPrioridadData.every(d => d.cantidad === 0) ? (
              <p className="text-sm text-gray-400 py-12 text-center">No hay datos</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barPrioridadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="cantidad" name="Cantidad" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          {renderPieChart(jefePieData, 'Requerimientos del Área por Estado')}
        </div>

        <div className="w-full">
          {renderRecentRequerimientosTable(true)}
        </div>
      </div>
    );
  };

  const renderAnalistaDashboard = () => {
    const cotizacionesAbiertas = solicitudesCotizacion.filter((s) => s.estado === 'ABIERTA').length;
    const cotizacionesAdjudicadas = solicitudesCotizacion.filter((s) => s.estado === 'ADJUDICADA').length;
    const chartDataOC = ordenesCompra.slice(0, 5).map((o) => ({
      name: o.numero.substring(o.numero.length - 6),
      monto: o.montoTotal,
    }));
    const cotPieData = getPieChartData(solicitudesCotizacion, 'estado', ESTADO_COT_LABELS);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Cotizaciones Abiertas" value={cotizacionesAbiertas} icon={Layers} color="primary" />
          <StatCard label="Cotizaciones Adjudicadas" value={cotizacionesAdjudicadas} icon={CheckCircle} color="green" />
          <StatCard label="Órdenes de Compra Generadas" value={ordenesCompra.length} icon={ShoppingCart} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderPieChart(cotPieData, 'Solicitudes de Cotización por Estado')}
          <Card title="Montos de Órdenes de Compra Recientes (S/)">
            {chartDataOC.length === 0 ? (
              <p className="text-sm text-gray-400">Sin órdenes generadas aún</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataOC}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Monto']} />
                    <Bar dataKey="monto" fill="#006D77" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Card title="Solicitudes de Cotización Recientes">
          {solicitudesCotizacion.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay solicitudes de cotización registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 font-semibold">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Título</th>
                    <th className="py-3 px-4">Fecha Límite</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesCotizacion.slice(0, 5).map((sol) => (
                    <tr key={sol.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-semibold text-primary-DEFAULT">{sol.codigo}</td>
                      <td className="py-3 px-4 font-medium">{sol.titulo}</td>
                      <td className="py-3 px-4 text-gray-500">{formatDateOnly(sol.fechaLimite)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          sol.estado === 'ABIERTA' ? 'bg-green-100 text-green-800' :
                          sol.estado === 'ADJUDICADA' ? 'bg-blue-100 text-blue-800' :
                          sol.estado === 'CERRADA' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ESTADO_COT_LABELS[sol.estado] || sol.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/cotizaciones/${sol.id}`} className="text-xs font-semibold hover:underline" style={{ color: '#006D77' }}>
                          Ver detalles
                        </Link>
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
  };

  const renderGerenteDashboard = () => {
    const ordenesAprobadasVal = ordenesCompra
      .filter((o) => ['APROBADA', 'EN_RECEPCION', 'RECEPCION_PARCIAL', 'RECEPCION_COMPLETA', 'CERRADA'].includes(o.estado))
      .reduce((acc, o) => acc + (Number(o.montoTotal) || 0), 0);

    const pendientesFirma = ordenesCompra.filter((o) => o.estado === 'PENDIENTE_APROBACION').length;
    const reqsPendientesGerente = requerimientos.filter((r) => r.estado === 'APROBADO').length;

    const chartDataOC = ordenesCompra.slice(0, 5).map((o) => ({
      name: o.numero.substring(o.numero.length - 6),
      monto: o.montoTotal,
    }));
    const ocPieData = getPieChartData(ordenesCompra, 'estado', ESTADO_OC_LABELS);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Monto Aprobado (S/)" value={formatCurrency(ordenesAprobadasVal)} icon={DollarSign} color="green" />
          <StatCard label="OC Pendientes de Firma" value={pendientesFirma} icon={Clock} color="amber" />
          <StatCard label="Reqs. Aprobados Jefe (Pend. Gerente)" value={reqsPendientesGerente} icon={ClipboardList} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderPieChart(ocPieData, 'Órdenes de Compra por Estado')}
          <Card title="Montos por Orden de Compra (S/)">
            {chartDataOC.length === 0 ? (
              <p className="text-sm text-gray-400">Sin órdenes de compra</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataOC}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Monto']} />
                    <Bar dataKey="monto" fill="#006D77" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Card title="Órdenes de Compra Pendientes de Aprobación">
          {ordenesCompra.filter((o) => o.estado === 'PENDIENTE_APROBACION').length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay órdenes de compra pendientes de firma</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 font-semibold">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Fecha Emisión</th>
                    <th className="py-3 px-4">Monto Total</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesCompra
                    .filter((o) => o.estado === 'PENDIENTE_APROBACION')
                    .slice(0, 5)
                    .map((oc) => (
                      <tr key={oc.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono font-semibold text-primary-DEFAULT">{oc.numero}</td>
                        <td className="py-3 px-4 font-medium">{oc.proveedor.razonSocial}</td>
                        <td className="py-3 px-4 text-gray-500">{formatDateOnly(oc.fechaEmision)}</td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{formatCurrency(oc.montoTotal)}</td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/ordenes-compra/${oc.id}`} className="text-xs font-semibold hover:underline" style={{ color: '#006D77' }}>
                            Firmar / Revisar
                          </Link>
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
  };

  const renderProveedorDashboard = () => {
    const totalVentasVal = ordenesProveedor.reduce((acc, o) => acc + (Number(o.montoTotal) || 0), 0);
    const adjudicadasBids = ofertasProveedor.filter((o) => o.estado === 'GANADORA' || o.estado === 'ADJUDICADA').length;
    const chartDataProveedor = ordenesProveedor.slice(0, 5).map((o) => ({
      name: o.numero.substring(o.numero.length - 6),
      monto: o.montoTotal,
    }));
    const ofPieData = getPieChartData(ofertasProveedor, 'estado', ESTADO_OFERTA_LABELS);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Órdenes Abiertas" value={ordenesProveedor.length} icon={ShoppingCart} color="amber" />
          <StatCard label="Ventas Totales (S/)" value={formatCurrency(totalVentasVal)} icon={DollarSign} color="green" />
          <StatCard label="Mis Ofertas Presentadas" value={ofertasProveedor.length} icon={Layers} color="blue" />
          <StatCard label="Ofertas Ganadoras" value={adjudicadasBids} icon={CheckCircle} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Ventas por Orden de Compra (S/)">
            {chartDataProveedor.length === 0 ? (
              <p className="text-sm text-gray-400">Sin ventas registradas aún</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataProveedor}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Ventas']} />
                    <Bar dataKey="monto" fill="#006D77" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          {renderPieChart(ofPieData, 'Estado de mis Ofertas')}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-primary-DEFAULT">
                Mis Órdenes de Compra Abiertas
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Órdenes de compra activas asignadas a tu cuenta</p>
            </div>
            <Link
              href="/ordenes-compra"
              className="flex items-center gap-1 text-sm font-medium text-secondary-DEFAULT hover:text-secondary-700 transition-colors"
              style={{ color: '#006D77' }}
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingOC ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-4 border-secondary-DEFAULT border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
            </div>
          ) : ordenesProveedor.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No tienes órdenes de compra abiertas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">Código</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Estado</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Fecha Emisión</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Monto Total</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ordenesProveedor.slice(0, 5).map((oc) => (
                    <tr key={oc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-sm font-semibold text-primary-DEFAULT">{oc.numero}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <EstadoOCBadge estado={oc.estado} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {formatDateOnly(oc.fechaEmision)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">
                        {formatCurrency(oc.montoTotal)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/ordenes-compra/${oc.id}`}
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
  };

  const renderAlmacenDashboard = () => {
    const stockBajoAlerts = inventario.filter((i) => i.stockBajo).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Productos en stock" value={inventario.length} icon={Package} color="secondary" />
          <StatCard label="Alertas de stock bajo" value={stockBajoAlerts} icon={AlertTriangle} color="red" />
          <StatCard label="Movimientos recientes" value={movimientos.length} icon={ArrowUpDown} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Stock actual por producto">
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400">No hay productos en inventario</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="cantidad" name="Cantidad actual" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cantidad < entry.stockMinimo ? '#FF6B6B' : COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="stockMinimo" name="Stock mínimo" fill="#E0E0E0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          {renderRecentMovementsCard()}
        </div>

        {renderInventoryDetailsTable()}
      </div>
    );
  };

  const renderContadorDashboard = () => {
    const facturasPendientes = facturas.filter((f) => ['PENDIENTE', 'OBSERVADA'].includes(f.estadoPago)).length;
    const facturasPagadas = facturas.filter((f) => f.estadoPago === 'PROCESADO' || f.estadoPago === 'PAGADA').length;
    const totalPagadoVal = pagos.reduce((acc, p) => acc + p.monto, 0);
    const montoPendienteVal = facturas
      .filter((f) => ['PENDIENTE', 'OBSERVADA'].includes(f.estadoPago))
      .reduce((acc, f) => acc + f.total, 0);

    const facPieData = getPieChartData(facturas, 'estadoPago', {
      PENDIENTE: 'Pendiente',
      PROCESADO: 'Procesado',
      OBSERVADA: 'Observada',
      RECHAZADA: 'Rechazada',
      PAGADA: 'Pagada',
    });

    const chartDataPagos = pagos.slice(0, 5).map((p) => ({
      name: formatDateOnly(p.fechaPago),
      monto: p.monto,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Facturas Pendientes" value={facturasPendientes} icon={FileText} color="amber" />
          <StatCard label="Facturas Pagadas" value={facturasPagadas} icon={CheckCircle} color="green" />
          <StatCard label="Total Pagado (S/)" value={formatCurrency(totalPagadoVal)} icon={DollarSign} color="green" />
          <StatCard label="Monto por Pagar (S/)" value={formatCurrency(montoPendienteVal)} icon={CreditCard} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderPieChart(facPieData, 'Facturas por Estado de Pago')}
          <Card title="Historial de Pagos Recientes (S/)">
            {chartDataPagos.length === 0 ? (
              <p className="text-sm text-gray-400">No hay pagos registrados aún</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataPagos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Monto Pagado']} />
                    <Bar dataKey="monto" fill="#006D77" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Card title="Facturas Recientes Recibidas">
          {facturas.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay facturas registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 font-semibold">
                    <th className="py-3 px-4">Número</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Monto Total</th>
                    <th className="py-3 px-4">Cruce</th>
                    <th className="py-3 px-4">Estado Pago</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.slice(0, 5).map((fac) => (
                    <tr key={fac.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-semibold text-primary-DEFAULT">{fac.numero}</td>
                      <td className="py-3 px-4 font-medium">{fac.proveedor.razonSocial}</td>
                      <td className="py-3 px-4 font-semibold text-gray-700">{formatCurrency(fac.total)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          fac.estadoCruce === 'CONFORME' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {fac.estadoCruce}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          fac.estadoPago === 'PAGADA' || fac.estadoPago === 'PROCESADO' ? 'bg-green-100 text-green-800' :
                          fac.estadoPago === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {fac.estadoPago}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/facturas`} className="text-xs font-semibold hover:underline" style={{ color: '#006D77' }}>
                          Ver expediente
                        </Link>
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
  };

  // --- MAIN RENDER ---

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

      {/* Tableros condicionales */}
      {isLoading || loadingExtra ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-4 border-secondary-DEFAULT border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
          <p className="text-sm font-medium">Cargando estadísticas del rol...</p>
        </div>
      ) : (
        <>
          {rol === 'ADMIN' && renderAdminDashboard()}
          {rol === 'TRABAJADOR' && renderTrabajadorDashboard()}
          {rol === 'JEFE_AREA' && renderJefeDashboard()}
          {rol === 'ANALISTA_COMPRAS' && renderAnalistaDashboard()}
          {rol === 'GERENTE' && renderGerenteDashboard()}
          {rol === 'PROVEEDOR' && renderProveedorDashboard()}
          {rol === 'ENCARGADO_ALMACEN' && renderAlmacenDashboard()}
          {rol === 'CONTADOR' && renderContadorDashboard()}
        </>
      )}
    </div>
  );
}

