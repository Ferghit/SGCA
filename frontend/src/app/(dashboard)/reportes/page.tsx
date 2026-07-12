'use client';

import { useEffect, useState } from 'react';
import { Card, StatCard } from '@/components/ui/Card';
import { formatDateOnly, formatDateShort } from '@/lib/utils';
import { reportesApi } from '@/lib/api';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart3,
  Download,
  Users,
  FileText,
  Archive,
  Warehouse,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type MainTab = 'gerenciales' | 'operativos';
type OperationalModule = 'usuarios' | 'productos' | 'requerimientos' | 'solicitudes-cotizacion' | 'ordenes-compra' | 'recepciones' | 'inventario';

export default function ReportesPage() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('gerenciales');
  const [activeGerencialTab, setActiveGerencialTab] = useState<'kpis' | 'compras' | 'proveedores' | 'productos'>('kpis');
  const [activeOperativoModule, setActiveOperativoModule] = useState<OperationalModule>('usuarios');
  
  // Gerenciales state
  const [kpis, setKpis] = useState<any>(null);
  const [compras, setCompras] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [rotacion, setRotacion] = useState<any[]>([]);
  const [stockCritico, setStockCritico] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportError, setReportError] = useState('');
  
  // Operativos state
  const [operativoData, setOperativoData] = useState<any[]>([]);
  const [isLoadingOperativos, setIsLoadingOperativos] = useState(false);
  const [filters, setFilters] = useState<{ fechaInicio?: string; fechaFin?: string }>({});
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch Gerenciales Data
  const fetchGerenciales = async () => {
    setIsLoading(true);
    setReportError('');
    try {
      const [kpisResult, comprasResult, proveedoresResult, rotacionResult, stockResult] = await Promise.allSettled([
        reportesApi.getKPIs(filters.fechaInicio, filters.fechaFin),
        reportesApi.getReporteCompras(filters.fechaInicio, filters.fechaFin),
        reportesApi.getReporteProveedores(),
        reportesApi.getProductosRotacion(filters.fechaInicio, filters.fechaFin),
        reportesApi.getStockCritico(),
      ]);

      if (kpisResult.status === 'fulfilled') setKpis(kpisResult.value);
      if (comprasResult.status === 'fulfilled') setCompras(comprasResult.value);
      if (proveedoresResult.status === 'fulfilled') setProveedores(proveedoresResult.value);
      if (rotacionResult.status === 'fulfilled') setRotacion(rotacionResult.value);
      if (stockResult.status === 'fulfilled') setStockCritico(stockResult.value);

      if ([kpisResult, comprasResult, proveedoresResult, rotacionResult, stockResult].some((item) => item.status === 'rejected')) {
        setReportError('Algunos reportes no pudieron cargarse. Verifica que el backend este activo y que tu usuario tenga permisos.');
      }
    } catch (error) {
      console.error('Error fetching gerenciales reports:', error);
      setReportError('No se pudieron cargar los reportes gerenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'gerenciales') {
      fetchGerenciales();
    }
  }, [activeMainTab]);

  // Fetch Operativos Data
  const fetchOperativos = async () => {
    setIsLoadingOperativos(true);
    setReportError('');
    try {
      let data;
      switch (activeOperativoModule) {
        case 'usuarios':
          data = await reportesApi.getOperativoUsuarios();
          break;
        case 'productos':
          data = await reportesApi.getOperativoProductos();
          break;
        case 'requerimientos':
          data = await reportesApi.getOperativoRequerimientos(filters.fechaInicio, filters.fechaFin);
          break;
        case 'solicitudes-cotizacion':
          data = await reportesApi.getOperativoSolicitudesCotizacion(filters.fechaInicio, filters.fechaFin);
          break;
        case 'ordenes-compra':
          data = await reportesApi.getOperativoOrdenesCompra(filters.fechaInicio, filters.fechaFin);
          break;
        case 'recepciones':
          data = await reportesApi.getOperativoRecepciones(filters.fechaInicio, filters.fechaFin);
          break;
        case 'inventario':
          data = await reportesApi.getOperativoInventario();
          break;
      }
      setOperativoData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching operativos reports:', error);
      setOperativoData([]);
      setReportError('No se pudo cargar el reporte operativo. Verifica que el backend este activo y que tu usuario tenga permisos.');
    } finally {
      setIsLoadingOperativos(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'operativos') {
      fetchOperativos();
    }
  }, [activeMainTab, activeOperativoModule]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeMainTab === 'gerenciales') {
      fetchGerenciales();
    } else {
      fetchOperativos();
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let blob: Blob | undefined;
      let filename = `reporte-${new Date().toISOString().split('T')[0]}.pdf`;
      if (activeMainTab === 'gerenciales') {
        switch (activeGerencialTab) {
          case 'compras':
            blob = await reportesApi.downloadComprasPDF(filters.fechaInicio, filters.fechaFin);
            filename = `reporte-compras-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'proveedores':
            blob = await reportesApi.downloadProveedoresPDF();
            filename = `reporte-proveedores-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'productos':
            blob = await reportesApi.downloadStockCriticoPDF();
            filename = `reporte-stock-critico-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
        }
      } else {
        switch (activeOperativoModule) {
          case 'usuarios':
            blob = await reportesApi.downloadOperativoUsuariosPDF();
            filename = `reporte-usuarios-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'productos':
            blob = await reportesApi.downloadOperativoProductosPDF();
            filename = `reporte-productos-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'requerimientos':
            blob = await reportesApi.downloadOperativoRequerimientosPDF(filters.fechaInicio, filters.fechaFin);
            filename = `reporte-requerimientos-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'solicitudes-cotizacion':
            blob = await reportesApi.downloadOperativoSolicitudesCotizacionPDF(filters.fechaInicio, filters.fechaFin);
            filename = `reporte-solicitudes-cotizacion-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'ordenes-compra':
            blob = await reportesApi.downloadOperativoOrdenesCompraPDF(filters.fechaInicio, filters.fechaFin);
            filename = `reporte-ordenes-compra-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'recepciones':
            blob = await reportesApi.downloadOperativoRecepcionesPDF(filters.fechaInicio, filters.fechaFin);
            filename = `reporte-recepciones-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'inventario':
            blob = await reportesApi.downloadOperativoInventarioPDF();
            filename = `reporte-inventario-${new Date().toISOString().split('T')[0]}.pdf`;
            break;
        }
      }
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const needsDateFilters = ['requerimientos', 'solicitudes-cotizacion', 'ordenes-compra', 'recepciones'];
  const COLORS = ['#006D77', '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#7209B7', '#00A896'];
  const chartDataRequerimientos = kpis ? [
    { name: 'Pendientes', value: kpis.requerimientos.pendientes, color: '#FFE66D' },
    { name: 'Aprobados', value: kpis.requerimientos.aprobados, color: '#4ECDC4' },
    { name: 'Rechazados', value: kpis.requerimientos.rechazados, color: '#FF6B6B' },
  ] : [];

  const chartDataRotacion = rotacion.slice(0, 8).map((item, idx) => ({
    name: item.producto.nombre.length > 15 ? item.producto.nombre.substring(0, 15) + '...' : item.producto.nombre,
    cantidad: item.cantidad,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-DEFAULT to-secondary-DEFAULT rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1B263B, #006D77)' }}>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BarChart3 className="w-7 h-7" />
          Módulo de Reportes
        </h1>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveMainTab('gerenciales')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeMainTab === 'gerenciales'
              ? 'text-secondary-DEFAULT border-secondary-DEFAULT'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
          style={activeMainTab === 'gerenciales' ? { color: '#006D77', borderColor: '#006D77' } : {}}
        >
          <TrendingUp className="w-4 h-4" />
          Reportes Gerenciales
        </button>
        <button
          onClick={() => setActiveMainTab('operativos')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeMainTab === 'operativos'
              ? 'text-secondary-DEFAULT border-secondary-DEFAULT'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
          style={activeMainTab === 'operativos' ? { color: '#006D77', borderColor: '#006D77' } : {}}
        >
          <FileText className="w-4 h-4" />
          Reportes Operativos
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </h3>
        </div>
        <form onSubmit={handleFilter} className="mt-4 flex flex-wrap items-end gap-4">
          {(activeMainTab === 'gerenciales' || needsDateFilters.includes(activeOperativoModule)) && (
            <>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={filters.fechaInicio || ''}
                  onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={filters.fechaFin || ''}
                  onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent"
                />
              </div>
            </>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-secondary-DEFAULT text-white rounded-lg hover:bg-opacity-90 transition-colors"
            style={{ backgroundColor: '#006D77' }}
          >
            Aplicar Filtros
          </button>
        </form>
      </Card>

      {/* Gerenciales Content */}
      {reportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {reportError}
        </div>
      )}

      {/* Gerenciales Content */}
      {activeMainTab === 'gerenciales' && (
        <div className="space-y-6">
          {/* Gerenciales Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { id: 'kpis', label: 'KPIs Gerenciales', icon: BarChart3 },
              { id: 'compras', label: 'Compras', icon: ShoppingCart },
              { id: 'proveedores', label: 'Proveedores', icon: TrendingUp },
              { id: 'productos', label: 'Productos', icon: Package },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeGerencialTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveGerencialTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'text-secondary-DEFAULT border-secondary-DEFAULT'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                  style={isActive ? { color: '#006D77', borderColor: '#006D77' } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-secondary-DEFAULT border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <>
              {/* KPIs Tab */}
              {activeGerencialTab === 'kpis' && kpis && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                      label="Requerimientos Pendientes"
                      value={kpis.requerimientos.pendientes}
                      icon={Clock}
                      color="amber"
                    />
                    <StatCard
                      label="Requerimientos Aprobados"
                      value={kpis.requerimientos.aprobados}
                      icon={CheckCircle}
                      color="green"
                    />
                    <StatCard
                      label="Requerimientos Rechazados"
                      value={kpis.requerimientos.rechazados}
                      icon={XCircle}
                      color="red"
                    />
                    <StatCard
                      label="Tiempo Prom. Aprobación (días)"
                      value={kpis.tiempoPromedioAprobacion}
                      icon={TrendingUp}
                      color="secondary"
                    />
                    <StatCard
                      label="Monto Total Compras"
                      value={`S/ ${Number(kpis.montoTotalCompras).toFixed(2)}`}
                      icon={ShoppingCart}
                      color="primary"
                    />
                    <StatCard
                      label="Proveedores en Ranking"
                      value={kpis.rankingProveedores.length}
                      icon={Package}
                      color="blue"
                    />
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Requerimientos por Estado">
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataRequerimientos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {chartDataRequerimientos.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card title="Top 10 Proveedores por Desempeño">
                      <div className="space-y-3">
                        {kpis.rankingProveedores.map((prov: any, idx: number) => (
                          <div key={prov.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary-DEFAULT text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#006D77' }}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{prov.proveedor.razonSocial}</p>
                                <p className="text-xs text-gray-500">Cumplimiento: {prov.puntajeCumplimiento}% | Precio: {prov.puntajePrecio}%</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-secondary-DEFAULT" style={{ color: '#006D77' }}>{prov.puntajeTotal} pts</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Compras Tab */}
              {activeGerencialTab === 'compras' && (
                <Card title="Reporte de Compras por Período" action={
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-DEFAULT text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#006D77' }}
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Descargando...' : 'Exportar PDF'}
                  </button>
                }>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-100">
                          <th className="py-3 px-4 font-semibold">N° Orden</th>
                          <th className="py-3 px-4 font-semibold">Proveedor</th>
                          <th className="py-3 px-4 font-semibold">Fecha Emisión</th>
                          <th className="py-3 px-4 font-semibold">Monto Total</th>
                          <th className="py-3 px-4 font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compras.map((oc) => (
                          <tr key={oc.id} className="border-b border-gray-50">
                            <td className="py-3 px-4 font-mono font-medium">{oc.numero}</td>
                            <td className="py-3 px-4">{oc.proveedor?.razonSocial || '-'}</td>
                            <td className="py-3 px-4">{formatDateShort(oc.createdAt)}</td>
                            <td className="py-3 px-4 font-medium">S/ {Number(oc.montoTotal).toFixed(2)}</td>
                            <td className="py-3 px-4">{oc.estado}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Proveedores Tab */}
              {activeGerencialTab === 'proveedores' && (
                <Card title="Reporte de Desempeño de Proveedores" action={
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-DEFAULT text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#006D77' }}
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Descargando...' : 'Exportar PDF'}
                  </button>
                }>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-100">
                          <th className="py-3 px-4 font-semibold">Proveedor</th>
                          <th className="py-3 px-4 font-semibold">Transacciones</th>
                          <th className="py-3 px-4 font-semibold">Entregas Conformes</th>
                          <th className="py-3 px-4 font-semibold">Incidencias</th>
                          <th className="py-3 px-4 font-semibold">Puntaje Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proveedores.map((prov) => (
                          <tr key={prov.id} className="border-b border-gray-50">
                            <td className="py-3 px-4 font-medium">{prov.proveedor?.razonSocial || '-'}</td>
                            <td className="py-3 px-4">{prov.transacciones}</td>
                            <td className="py-3 px-4 text-green-600">{prov.entregasConformes}</td>
                            <td className="py-3 px-4 text-red-600">{prov.incidencias}</td>
                            <td className="py-3 px-4 font-bold text-secondary-DEFAULT" style={{ color: '#006D77' }}>{prov.puntajeTotal} pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Productos Tab */}
              {activeGerencialTab === 'productos' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card title="Productos con Mayor Rotación">
                    {rotacion.length === 0 ? (
                      <p className="text-sm text-gray-400">No hay datos de rotación</p>
                    ) : (
                      <>
                        <div className="h-72 mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataRotacion} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="cantidad" fill="#006D77" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-100">
                                <th className="py-2 px-3 font-semibold">Producto</th>
                                <th className="py-2 px-3 font-semibold text-right">Cantidad</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rotacion.map((item) => (
                                <tr key={item.producto.id} className="border-b border-gray-50">
                                  <td className="py-2 px-3">{item.producto.nombre}</td>
                                  <td className="py-2 px-3 text-right font-medium">{item.cantidad}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </Card>

                  <Card title="Productos con Stock Crítico" action={
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary-DEFAULT text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#006D77' }}
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Descargando...' : 'Exportar PDF'}
                    </button>
                  }>
                    {stockCritico.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <CheckCircle className="w-12 h-12 mb-3 opacity-30 text-green-500" />
                        <p className="text-sm font-medium">No hay productos con stock crítico</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stockCritico.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <div>
                                <p className="font-medium text-red-800">{item.producto.nombre}</p>
                                <p className="text-xs text-red-600">Stock mínimo: {item.stockMinimo}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-700">{item.cantidad} disponibles</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Operativos Content */}
      {activeMainTab === 'operativos' && (
        <div className="space-y-6">
          {/* Operativos Modules */}
          <div className="flex gap-2 border-b border-gray-200 flex-wrap">
            {[
              { id: 'usuarios', label: 'Usuarios', icon: Users },
              { id: 'productos', label: 'Productos', icon: Package },
              { id: 'requerimientos', label: 'Requerimientos', icon: ClipboardList },
              { id: 'solicitudes-cotizacion', label: 'Solicitudes de Cotización', icon: FileText },
              { id: 'ordenes-compra', label: 'Ordenes de Compra', icon: ShoppingCart },
              { id: 'recepciones', label: 'Recepciones', icon: Archive },
              { id: 'inventario', label: 'Inventario', icon: Warehouse },
            ].map((module) => {
              const Icon = module.icon;
              const isActive = activeOperativoModule === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveOperativoModule(module.id as OperationalModule)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'text-secondary-DEFAULT border-secondary-DEFAULT'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                  style={isActive ? { color: '#006D77', borderColor: '#006D77' } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {module.label}
                </button>
              );
            })}
          </div>

          {isLoadingOperativos ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-secondary-DEFAULT border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <Card title={`Reporte de ${activeOperativoModule.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`} action={
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-DEFAULT text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#006D77' }}
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Descargando...' : 'Exportar PDF'}
              </button>
            }>
              <div className="overflow-x-auto">
                {activeOperativoModule === 'usuarios' && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-3 px-4 font-semibold">Nombre</th>
                        <th className="py-3 px-4 font-semibold">Apellido</th>
                        <th className="py-3 px-4 font-semibold">Email</th>
                        <th className="py-3 px-4 font-semibold">Rol</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativoData.map((user) => (
                        <tr key={user.id} className="border-b border-gray-50">
                          <td className="py-3 px-4">{user.nombre}</td>
                          <td className="py-3 px-4">{user.apellido}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{user.rol}</td>
                          <td className="py-3 px-4">{user.activo ? 'Activo' : 'Inactivo'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeOperativoModule === 'productos' && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-3 px-4 font-semibold">Código</th>
                        <th className="py-3 px-4 font-semibold">Nombre</th>
                        <th className="py-3 px-4 font-semibold">Categoría</th>
                        <th className="py-3 px-4 font-semibold">Precio Referencial</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativoData.map((prod) => (
                        <tr key={prod.id} className="border-b border-gray-50">
                          <td className="py-3 px-4 font-mono">{prod.codigo}</td>
                          <td className="py-3 px-4">{prod.nombre}</td>
                          <td className="py-3 px-4">{prod.categoria}</td>
                          <td className="py-3 px-4">{prod.precioReferencial ? `S/ ${Number(prod.precioReferencial).toFixed(2)}` : '-'}</td>
                          <td className="py-3 px-4">{prod.activo ? 'Activo' : 'Inactivo'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeOperativoModule === 'requerimientos' && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-3 px-4 font-semibold">Código</th>
                        <th className="py-3 px-4 font-semibold">Solicitante</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                        <th className="py-3 px-4 font-semibold">Fecha Requerida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativoData.map((req) => (
                        <tr key={req.id} className="border-b border-gray-50">
                          <td className="py-3 px-4 font-mono">{req.codigo}</td>
                          <td className="py-3 px-4">{req.solicitante?.nombre} {req.solicitante?.apellido}</td>
                          <td className="py-3 px-4">{req.estado}</td>
                          <td className="py-3 px-4">{formatDateOnly(req.fechaRequerida)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeOperativoModule === 'solicitudes-cotizacion' && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-3 px-4 font-semibold">Código</th>
                        <th className="py-3 px-4 font-semibold">Título</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                        <th className="py-3 px-4 font-semibold">Fecha Límite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativoData.map((sol) => (
                        <tr key={sol.id} className="border-b border-gray-50">
                          <td className="py-3 px-4 font-mono">{sol.codigo}</td>
                          <td className="py-3 px-4">{sol.titulo}</td>
                          <td className="py-3 px-4">{sol.estado}</td>
                          <td className="py-3 px-4">{formatDateShort(sol.fechaLimite)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeOperativoModule === 'ordenes-compra' && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-3 px-4 font-semibold">Número</th>
                        <th className="py-3 px-4 font-semibold">Proveedor</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                        <th className="py-3 px-4 font-semibold">Monto Total</th>
                        <th className="py-3 px-4 font-semibold">Fecha Emisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativoData.map((oc) => (
                        <tr key={oc.id} className="border-b border-gray-50">
                          <td className="py-3 px-4 font-mono">{oc.numero}</td>
                          <td className="py-3 px-4">{oc.proveedor?.razonSocial || '-'}</td>
                          <td className="py-3 px-4">{oc.estado}</td>
                          <td className="py-3 px-4 font-medium">S/ {Number(oc.montoTotal).toFixed(2)}</td>
                          <td className="py-3 px-4">{formatDateShort(oc.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeOperativoModule === 'recepciones' && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-3 px-4 font-semibold">Orden de Compra</th>
                        <th className="py-3 px-4 font-semibold">Fecha Recepción</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativoData.map((rec) => (
                        <tr key={rec.id} className="border-b border-gray-50">
                          <td className="py-3 px-4 font-mono">{rec.ordenCompra?.numero || '-'}</td>
                          <td className="py-3 px-4">{formatDateShort(rec.fechaRecepcion)}</td>
                          <td className="py-3 px-4">{rec.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeOperativoModule === 'inventario' && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-3 px-4 font-semibold">Producto</th>
                        <th className="py-3 px-4 font-semibold">Cantidad</th>
                        <th className="py-3 px-4 font-semibold">Stock Mínimo</th>
                        <th className="py-3 px-4 font-semibold">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativoData.map((inv) => (
                        <tr key={inv.id} className="border-b border-gray-50">
                          <td className="py-3 px-4">{inv.producto?.nombre || '-'}</td>
                          <td className="py-3 px-4">{inv.cantidad}</td>
                          <td className="py-3 px-4">{inv.stockMinimo}</td>
                          <td className="py-3 px-4">{inv.ubicacion || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
