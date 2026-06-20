'use client';

import { useEffect, useState } from 'react';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card, StatCard } from '@/components/ui/Card';
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
                        <Link 
                          href="/inventario" 
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-secondary-DEFAULT hover:bg-secondary-50 rounded transition-colors"
                          style={{ color: '#006D77' }}
                        >
                          <Eye className="w-3 h-3" />
                          Ver movimientos
                        </Link>
                        <Link 
                          href="/inventario" 
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        >
                          <History className="w-3 h-3" />
                          Historial
                        </Link>
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
    </div>
  );
}
