'use client';

import { useEffect } from 'react';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card, StatCard } from '@/components/ui/Card';
import { Package, AlertTriangle, ArrowUpDown } from 'lucide-react';

export default function InventarioPage() {
  const { inventario, movimientos, fetchInventario, fetchMovimientos } = useAlmacenStore();

  useEffect(() => {
    fetchInventario();
    fetchMovimientos();
  }, []);

  const stockBajo = inventario.filter((i) => i.stockBajo);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-DEFAULT">Dashboard de Inventario</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Productos en stock" value={inventario.length} icon={Package} color="secondary" />
        <StatCard label="Alertas de stock bajo" value={stockBajo.length} icon={AlertTriangle} color="red" />
        <StatCard label="Movimientos recientes" value={movimientos.length} icon={ArrowUpDown} color="blue" />
      </div>

      {stockBajo.length > 0 && (
        <Card title="Alertas de stock bajo">
          <div className="space-y-2">
            {stockBajo.map((i) => (
              <div key={i.id} className="flex justify-between text-sm p-2 bg-red-50 rounded-lg">
                <span>{i.producto.nombre}</span>
                <span className="text-red-600 font-medium">{i.cantidad} / mín {i.stockMinimo}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Stock actual por producto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b">
              <th className="py-2 font-medium">Producto</th>
              <th className="font-medium">Cantidad</th>
              <th className="font-medium">Stock mínimo</th>
              <th className="font-medium">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map((i) => (
              <tr key={i.id} className="border-b border-gray-50">
                <td className="py-2">{i.producto.nombre}</td>
                <td>{i.cantidad}</td>
                <td>{i.stockMinimo}</td>
                <td>{i.ubicacion ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Historial de movimientos">
        {movimientos.length === 0 && <p className="text-sm text-gray-400">Sin movimientos aún.</p>}
        <div className="space-y-2">
          {movimientos.map((m, idx) => (
            <div key={idx} className="flex justify-between text-sm border-b border-gray-50 pb-2">
              <span>{m.producto} — <span className="text-gray-400">{m.referencia}</span></span>
              <span className={m.tipo === 'ENTRADA' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
