'use client';

import { useEffect, useState } from 'react';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card, StatCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import type { InventarioItem, MovimientoInventario } from '@/types';
import { 
  Package, 
  AlertTriangle, 
  ArrowUpDown, 
  Eye, 
  History, 
  Truck,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';

export default function InventarioPage() {
  const { inventario, movimientos, fetchInventario, fetchMovimientos } = useAlmacenStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<InventarioItem | null>(null);
  const [vistaDetalle, setVistaDetalle] = useState<'movimientos' | 'historial'>('movimientos');
  const [movimientosProducto, setMovimientosProducto] = useState<MovimientoInventario[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');

  useEffect(() => {
    fetchInventario();
    fetchMovimientos();
  }, []);

  const stockBajo = inventario.filter((i) => i.stockBajo);
  const stockAgotado = inventario.filter((i) => Number(i.cantidad) === 0);

  // Helper functions to get last entrada and salida for each product
  const getLastMovementForProduct = (productId: number | undefined, tipo: 'ENTRADA' | 'SALIDA') => {
    if (!productId) return null;
    return movimientos
      .filter(m => m.tipo === tipo && m.producto === inventario.find(i => i.producto.id === productId)?.producto.nombre)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
  };

  // Function to determine estado
  const getEstado = (item: any) => {
    if (Number(item.cantidad) === 0) return 'AGOTADO';
    if (item.stockBajo) return 'BAJO';
    return 'NORMAL';
  };

  // Filter inventory
  const filteredInventario = inventario.filter((item) => {
    const matchesSearch = item.producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const estado = getEstado(item);
    const matchesEstado = filterEstado ? estado === filterEstado : true;
    return matchesSearch && matchesEstado;
  });

  const abrirDetalle = async (item: InventarioItem, vista: 'movimientos' | 'historial') => {
    setProductoSeleccionado(item);
    setVistaDetalle(vista);
    setMovimientosProducto([]);
    setErrorDetalle('');
    setCargandoDetalle(true);

    try {
      const { data } = await api.get<MovimientoInventario[]>('/almacen/inventario/movimientos', {
        params: { productoId: item.productoId },
      });
      setMovimientosProducto(data);
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

  const movimientosConSaldo = (() => {
    if (!productoSeleccionado) return [];

    const ordenados = [...movimientosProducto].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );
    const variacionMostrada = ordenados.reduce(
      (total, movimiento) => total + (movimiento.tipo === 'ENTRADA' ? Number(movimiento.cantidad) : -Number(movimiento.cantidad)),
      0,
    );
    let saldo = Number(productoSeleccionado.cantidad) - variacionMostrada;

    return ordenados.map((movimiento) => {
      saldo += movimiento.tipo === 'ENTRADA' ? Number(movimiento.cantidad) : -Number(movimiento.cantidad);
      return { ...movimiento, saldo };
    });
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-DEFAULT">Inventario</h1>
        <p className="text-sm text-gray-500">Vista operativa/detallada</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Productos en stock" value={inventario.length} icon={Package} color="secondary" />
        <StatCard 
          label="Stock normal" 
          value={inventario.filter(i => getEstado(i) === 'NORMAL').length} 
          icon={Package} 
          color="green" 
        />
        <StatCard 
          label="Alertas de stock bajo" 
          value={stockBajo.length} 
          icon={AlertTriangle} 
          color="amber" 
        />
        <StatCard 
          label="Productos agotados" 
          value={stockAgotado.length} 
          icon={AlertTriangle} 
          color="red" 
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="NORMAL">Normal</option>
              <option value="BAJO">Bajo</option>
              <option value="AGOTADO">Agotado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Detailed Inventory Table */}
      <Card title="Tabla completa de productos">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-3 px-4 font-semibold">Producto</th>
                <th className="py-3 px-4 font-semibold">Stock actual</th>
                <th className="py-3 px-4 font-semibold">Stock mínimo</th>
                <th className="py-3 px-4 font-semibold">Ubicación</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold">Última entrada</th>
                <th className="py-3 px-4 font-semibold">Última salida</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventario.map((item) => {
                const estado = getEstado(item);
                const lastEntrada = getLastMovementForProduct(item.productoId, 'ENTRADA');
                const lastSalida = getLastMovementForProduct(item.productoId, 'SALIDA');

                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-primary-DEFAULT">{item.producto.nombre}</p>
                      <p className="text-xs text-gray-400">Código: {item.producto.codigo}</p>
                    </td>
                    <td className={estado === 'AGOTADO' ? 'text-red-600 font-bold py-3 px-4' : estado === 'BAJO' ? 'text-amber-600 font-medium py-3 px-4' : 'py-3 px-4'}>
                      {item.cantidad}
                    </td>
                    <td className="py-3 px-4">{item.stockMinimo}</td>
                    <td className="py-3 px-4">{item.ubicacion ?? '-'}</td>
                    <td className="py-3 px-4">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          estado === 'NORMAL' 
                            ? 'bg-green-50 text-green-700' 
                            : estado === 'BAJO' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {estado === 'NORMAL' ? 'Normal' : estado === 'BAJO' ? 'Bajo' : 'Agotado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {lastEntrada ? (
                        <>
                          <p className="text-gray-700">+{lastEntrada.cantidad}</p>
                          <p className="text-gray-400">{new Date(lastEntrada.fecha).toLocaleDateString('es-PE')}</p>
                        </>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {lastSalida ? (
                        <>
                          <p className="text-red-600">-{lastSalida.cantidad}</p>
                          <p className="text-gray-400">{new Date(lastSalida.fecha).toLocaleDateString('es-PE')}</p>
                        </>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => abrirDetalle(item, 'movimientos')}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-secondary-DEFAULT hover:bg-secondary-50 rounded transition-colors"
                          style={{ color: '#006D77' }}
                        >
                          <Eye className="w-3 h-3" />
                          Ver movimientos
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirDetalle(item, 'historial')}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        >
                          <History className="w-3 h-3" />
                          Historial
                        </button>
                        <Link 
                          href="/recepciones" 
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        >
                          <Truck className="w-3 h-3" />
                          Recepciones
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={Boolean(productoSeleccionado)}
        onClose={cerrarDetalle}
        title={productoSeleccionado ? `${vistaDetalle === 'movimientos' ? 'Movimientos' : 'Historial'} — ${productoSeleccionado.producto.nombre}` : 'Detalle de inventario'}
        maxWidthClass="max-w-3xl"
      >
        {productoSeleccionado && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Código</p>
                <p className="mt-1 text-sm font-medium text-gray-700">{productoSeleccionado.producto.codigo}</p>
              </div>
              <div className="rounded-lg bg-teal-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Stock actual</p>
                <p className="mt-1 text-lg font-bold text-teal-800">{productoSeleccionado.cantidad}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ubicación</p>
                <p className="mt-1 text-sm font-medium text-gray-700">{productoSeleccionado.ubicacion || 'Sin ubicación'}</p>
              </div>
            </div>

            <div className="flex gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setVistaDetalle('movimientos')}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${vistaDetalle === 'movimientos' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Movimientos
              </button>
              <button
                type="button"
                onClick={() => setVistaDetalle('historial')}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${vistaDetalle === 'historial' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Historial de saldo
              </button>
            </div>

            {cargandoDetalle && (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
              </div>
            )}

            {!cargandoDetalle && errorDetalle && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorDetalle}</div>
            )}

            {!cargandoDetalle && !errorDetalle && movimientosProducto.length === 0 && (
              <div className="py-10 text-center">
                <ArrowUpDown className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">Este producto aún no tiene movimientos registrados.</p>
              </div>
            )}

            {!cargandoDetalle && !errorDetalle && movimientosProducto.length > 0 && vistaDetalle === 'movimientos' && (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...movimientosProducto]
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map((movimiento, index) => (
                        <tr key={`${movimiento.tipo}-${movimiento.fecha}-${index}`}>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${movimiento.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {movimiento.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${movimiento.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {movimiento.tipo === 'ENTRADA' ? '+' : '-'}{movimiento.cantidad}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{new Date(movimiento.fecha).toLocaleString('es-PE')}</td>
                          <td className="px-4 py-3 text-gray-600">{movimiento.referencia}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {!cargandoDetalle && !errorDetalle && movimientosConSaldo.length > 0 && vistaDetalle === 'historial' && (
              <div className="space-y-0">
                {movimientosConSaldo.map((movimiento, index) => (
                  <div key={`${movimiento.tipo}-${movimiento.fecha}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                    <div className="relative flex w-9 shrink-0 justify-center">
                      <div className={`z-10 flex h-9 w-9 items-center justify-center rounded-full ${movimiento.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {movimiento.tipo === 'ENTRADA' ? '+' : '-'}
                      </div>
                      {index < movimientosConSaldo.length - 1 && <div className="absolute top-9 h-full w-px bg-gray-200" />}
                    </div>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-4 rounded-lg border border-gray-100 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {movimiento.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} de {movimiento.cantidad} unidad(es)
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{movimiento.referencia} · {new Date(movimiento.fecha).toLocaleString('es-PE')}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-400">Saldo posterior</p>
                        <p className="font-bold text-gray-800">{movimiento.saldo}</p>
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
