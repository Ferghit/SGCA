'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  ExternalLink,
  Eye,
  Filter,
  History,
  Package,
  Search,
  Truck,
} from 'lucide-react';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card, StatCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import type { InventarioItem, MovimientoInventario } from '@/types';

type VistaDetalle = 'movimientos' | 'historial';
type EstadoInventario = 'NORMAL' | 'BAJO' | 'AGOTADO';

const formatoCantidad = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

export default function InventarioPage() {
  const { inventario, movimientos, fetchInventario, fetchMovimientos } = useAlmacenStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<InventarioItem | null>(null);
  const [vistaDetalle, setVistaDetalle] = useState<VistaDetalle>('movimientos');
  const [movimientosProducto, setMovimientosProducto] = useState<MovimientoInventario[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');

  useEffect(() => {
    fetchInventario();
    fetchMovimientos();
  }, [fetchInventario, fetchMovimientos]);

  const getEstado = (item: InventarioItem): EstadoInventario => {
    if (Number(item.cantidad) === 0) return 'AGOTADO';
    if (item.stockBajo) return 'BAJO';
    return 'NORMAL';
  };

  const stockBajo = inventario.filter((item) => item.stockBajo && Number(item.cantidad) > 0);
  const stockAgotado = inventario.filter((item) => Number(item.cantidad) === 0);

  const getLastMovementForProduct = (productId: number, tipo: MovimientoInventario['tipo']) =>
    movimientos
      .filter((movimiento) => movimiento.tipo === tipo && movimiento.productoId === productId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

  const filteredInventario = inventario.filter((item) => {
    const termino = searchTerm.trim().toLowerCase();
    const matchesSearch = !termino
      || item.producto.nombre.toLowerCase().includes(termino)
      || item.producto.codigo.toLowerCase().includes(termino);
    const matchesEstado = filterEstado ? getEstado(item) === filterEstado : true;
    return matchesSearch && matchesEstado;
  });

  const abrirDetalle = async (item: InventarioItem, vista: VistaDetalle) => {
    setProductoSeleccionado(item);
    setVistaDetalle(vista);
    setMovimientosProducto([]);
    setErrorDetalle('');
    setCargandoDetalle(true);

    try {
      const { data } = await api.get<MovimientoInventario[]>('/almacen/inventario/movimientos', {
        params: { productoId: item.productoId },
      });
      setMovimientosProducto(data.filter((movimiento) => movimiento.productoId === item.productoId));
    } catch (error: any) {
      setErrorDetalle(error.response?.data?.message || 'No se pudieron cargar los movimientos del producto.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setProductoSeleccionado(null);
    setMovimientosProducto([]);
    setErrorDetalle('');
  };

  const movimientosOrdenados = useMemo(
    () => [...movimientosProducto].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    [movimientosProducto],
  );

  const resumenMovimientos = useMemo(() => {
    const entradas = movimientosProducto.filter((movimiento) => movimiento.tipo === 'ENTRADA');
    const salidas = movimientosProducto.filter((movimiento) => movimiento.tipo === 'SALIDA');
    return {
      entradas: entradas.length,
      salidas: salidas.length,
      unidadesEntrada: entradas.reduce((total, movimiento) => total + Number(movimiento.cantidad), 0),
      unidadesSalida: salidas.reduce((total, movimiento) => total + Number(movimiento.cantidad), 0),
    };
  }, [movimientosProducto]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-primary-DEFAULT">Inventario</h1>
        <p className="text-sm text-gray-500">Vista operativa y detallada</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Productos en stock" value={inventario.length} icon={Package} color="secondary" />
        <StatCard label="Stock normal" value={inventario.filter((item) => getEstado(item) === 'NORMAL').length} icon={Package} color="green" />
        <StatCard label="Alertas de stock bajo" value={stockBajo.length} icon={AlertTriangle} color="amber" />
        <StatCard label="Productos agotados" value={stockAgotado.length} icon={AlertTriangle} color="red" />
      </div>

      <Card className="p-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por producto o código..."
              className="w-full border-0 bg-transparent p-0 text-sm outline-none"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:w-auto"
              value={filterEstado}
              onChange={(event) => setFilterEstado(event.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="NORMAL">Normal</option>
              <option value="BAJO">Bajo</option>
              <option value="AGOTADO">Agotado</option>
            </select>
          </label>
        </div>
      </Card>

      <Card title="Tabla completa de productos" subtitle={`${filteredInventario.length} producto(s) encontrado(s)`}>
        {filteredInventario.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-3 h-9 w-9 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No hay productos que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Stock actual</th>
                  <th className="px-4 py-3 font-semibold">Stock mínimo</th>
                  <th className="px-4 py-3 font-semibold">Ubicación</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Última entrada</th>
                  <th className="px-4 py-3 font-semibold">Última salida</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventario.map((item) => {
                  const estado = getEstado(item);
                  const lastEntrada = getLastMovementForProduct(item.productoId, 'ENTRADA');
                  const lastSalida = getLastMovementForProduct(item.productoId, 'SALIDA');

                  return (
                    <tr key={item.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-primary-DEFAULT">{item.producto.nombre}</p>
                        <p className="text-xs text-gray-400">Código: {item.producto.codigo}</p>
                      </td>
                      <td className={`px-4 py-3 ${estado === 'AGOTADO' ? 'font-bold text-red-600' : estado === 'BAJO' ? 'font-medium text-amber-600' : ''}`}>
                        {formatoCantidad.format(Number(item.cantidad))}
                      </td>
                      <td className="px-4 py-3">{formatoCantidad.format(Number(item.stockMinimo))}</td>
                      <td className="px-4 py-3">{item.ubicacion ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${estado === 'NORMAL' ? 'bg-green-50 text-green-700' : estado === 'BAJO' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {estado === 'NORMAL' ? 'Normal' : estado === 'BAJO' ? 'Bajo' : 'Agotado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {lastEntrada ? (
                          <>
                            <p className="font-medium text-emerald-700">+{formatoCantidad.format(Number(lastEntrada.cantidad))}</p>
                            <p className="text-gray-400">{new Date(lastEntrada.fecha).toLocaleDateString('es-PE')}</p>
                          </>
                        ) : <span className="text-gray-400">Sin registros</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {lastSalida ? (
                          <>
                            <p className="font-medium text-red-600">-{formatoCantidad.format(Number(lastSalida.cantidad))}</p>
                            <p className="text-gray-400">{new Date(lastSalida.fecha).toLocaleDateString('es-PE')}</p>
                          </>
                        ) : <span className="text-gray-400">Sin registros</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirDetalle(item, 'movimientos')}
                            className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Movimientos
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirDetalle(item, 'historial')}
                            className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          >
                            <History className="h-3.5 w-3.5" />
                            Historial
                          </button>
                          <Link href="/recepciones" aria-label="Ver recepciones" title="Ver recepciones" className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-teal-700">
                            <Truck className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={Boolean(productoSeleccionado)}
        onClose={cerrarDetalle}
        title={productoSeleccionado ? `Detalle de inventario - ${productoSeleccionado.producto.nombre}` : 'Detalle de inventario'}
        maxWidthClass="max-w-4xl"
      >
        {productoSeleccionado && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="Código" value={productoSeleccionado.producto.codigo} />
              <Metric label="Stock actual" value={formatoCantidad.format(Number(productoSeleccionado.cantidad))} tone="teal" />
              <Metric label="Ubicación" value={productoSeleccionado.ubicacion || 'Sin ubicación'} />
              <Metric label="Movimientos" value={String(movimientosProducto.length)} />
            </div>

            <div className="flex w-full gap-1 rounded-lg bg-gray-100 p-1 sm:w-fit">
              <button
                type="button"
                onClick={() => setVistaDetalle('movimientos')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${vistaDetalle === 'movimientos' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ArrowUpDown className="h-4 w-4" />
                Movimientos
              </button>
              <button
                type="button"
                onClick={() => setVistaDetalle('historial')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${vistaDetalle === 'historial' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <History className="h-4 w-4" />
                Historial
              </button>
            </div>

            {cargandoDetalle && (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
              </div>
            )}

            {!cargandoDetalle && errorDetalle && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorDetalle}</div>
            )}

            {!cargandoDetalle && !errorDetalle && movimientosProducto.length === 0 && (
              <div className="py-12 text-center">
                <ArrowUpDown className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">Este producto aún no tiene movimientos registrados.</p>
              </div>
            )}

            {!cargandoDetalle && !errorDetalle && movimientosProducto.length > 0 && vistaDetalle === 'movimientos' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <MovementSummary icon={<ArrowDownLeft className="h-4 w-4" />} label={`${resumenMovimientos.entradas} entrada(s)`} value={`+${formatoCantidad.format(resumenMovimientos.unidadesEntrada)}`} tone="green" />
                  <MovementSummary icon={<ArrowUpRight className="h-4 w-4" />} label={`${resumenMovimientos.salidas} salida(s)`} value={`-${formatoCantidad.format(resumenMovimientos.unidadesSalida)}`} tone="red" />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                        <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                        <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                        <th className="px-4 py-3 text-left font-semibold">Referencia</th>
                        <th className="px-4 py-3 text-left font-semibold">Detalle</th>
                        <th className="w-10 px-3 py-3"><span className="sr-only">Abrir</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {movimientosOrdenados.map((movimiento) => (
                        <tr key={`${movimiento.origen}-${movimiento.id}`} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3"><MovementBadge tipo={movimiento.tipo} /></td>
                          <td className={`px-4 py-3 text-right font-semibold ${movimiento.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {movimiento.tipo === 'ENTRADA' ? '+' : '-'}{formatoCantidad.format(Number(movimiento.cantidad))}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-600">{new Date(movimiento.fecha).toLocaleString('es-PE')}</td>
                          <td className="px-4 py-3 font-medium text-gray-700">{movimiento.referencia}</td>
                          <td className="max-w-[220px] truncate px-4 py-3 text-gray-500" title={movimiento.detalle || undefined}>{movimiento.detalle || '-'}</td>
                          <td className="px-3 py-3 text-right">
                            {movimiento.enlace && (
                              <Link href={movimiento.enlace} title={`Abrir ${movimiento.referencia}`} className="inline-flex rounded p-1.5 text-gray-400 hover:bg-teal-50 hover:text-teal-700">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!cargandoDetalle && !errorDetalle && movimientosProducto.length > 0 && vistaDetalle === 'historial' && (
              <div className="space-y-0">
                {movimientosOrdenados.map((movimiento, index) => (
                  <div key={`${movimiento.origen}-${movimiento.id}`} className="relative flex gap-4 pb-5 last:pb-0">
                    <div className="relative flex w-9 shrink-0 justify-center">
                      <div className={`z-10 flex h-9 w-9 items-center justify-center rounded-full ${movimiento.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {movimiento.tipo === 'ENTRADA' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      {index < movimientosOrdenados.length - 1 && <div className="absolute top-9 h-full w-px bg-gray-200" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{movimiento.referencia}</p>
                          <MovementBadge tipo={movimiento.tipo} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{new Date(movimiento.fecha).toLocaleString('es-PE')}</p>
                        {movimiento.detalle && <p className="mt-2 text-sm text-gray-600">{movimiento.detalle}</p>}
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-3 sm:block sm:text-right">
                        <p className={`font-bold ${movimiento.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-red-700'}`}>
                          {movimiento.tipo === 'ENTRADA' ? '+' : '-'}{formatoCantidad.format(Number(movimiento.cantidad))}
                        </p>
                        {movimiento.enlace && (
                          <Link href={movimiento.enlace} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline">
                            Ver origen <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Metric({ label, value, tone = 'gray' }: { label: string; value: string; tone?: 'gray' | 'teal' }) {
  return (
    <div className={`rounded-lg p-3 ${tone === 'teal' ? 'bg-teal-50' : 'bg-gray-50'}`}>
      <p className={`text-xs font-semibold uppercase ${tone === 'teal' ? 'text-teal-600' : 'text-gray-400'}`}>{label}</p>
      <p className={`mt-1 truncate font-semibold ${tone === 'teal' ? 'text-teal-800' : 'text-gray-700'}`} title={value}>{value}</p>
    </div>
  );
}

function MovementSummary({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'green' | 'red' }) {
  const classes = tone === 'green' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700';
  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${classes}`}>
      <div className="flex items-center gap-2">{icon}<span className="text-xs font-medium sm:text-sm">{label}</span></div>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function MovementBadge({ tipo }: { tipo: MovimientoInventario['tipo'] }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      {tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
    </span>
  );
}
