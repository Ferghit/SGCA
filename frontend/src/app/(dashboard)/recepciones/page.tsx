'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card } from '@/components/ui/Card';
import { Package } from 'lucide-react';

type Tab = 'pendientes' | 'registradas';

export default function RecepcionesPage() {
  const { ordenesPendientes, recepciones, fetchOrdenesPendientes, fetchRecepciones, isLoading } = useAlmacenStore();
  const [activeTab, setActiveTab] = useState<Tab>('pendientes');

  useEffect(() => {
    fetchOrdenesPendientes();
    fetchRecepciones();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-DEFAULT">Recepción de Mercancía</h1>

      {/* Tabs selector */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'pendientes'
              ? 'text-secondary-DEFAULT border-b-2 border-secondary-DEFAULT bg-secondary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          style={{ '--tw-text-opacity': '1', color: activeTab === 'pendientes' ? '#006D77' : undefined } as React.CSSProperties}
        >
          Órdenes Pendientes
        </button>
        <button
          onClick={() => setActiveTab('registradas')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'registradas'
              ? 'text-secondary-DEFAULT border-b-2 border-secondary-DEFAULT bg-secondary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          style={{ '--tw-text-opacity': '1', color: activeTab === 'registradas' ? '#006D77' : undefined } as React.CSSProperties}
        >
          Recepciones Registradas
        </button>
      </div>

      {activeTab === 'pendientes' && (
        <Card title="Órdenes de Compra pendientes de recepción">
          {isLoading && <p className="text-sm text-gray-400">Cargando...</p>}
          {!isLoading && ordenesPendientes.length === 0 && (
            <p className="text-sm text-gray-400">No hay órdenes pendientes.</p>
          )}
          <div className="space-y-2">
            {ordenesPendientes.map((oc) => (
              <Link
                key={oc.id}
                href={`/recepciones/${oc.id}`}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-secondary-DEFAULT" />
                  <div>
                    <p className="font-medium text-sm">{oc.numero}</p>
                    <p className="text-xs text-gray-500">{oc.proveedor.razonSocial}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                  {oc.estado}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'registradas' && (
        <Card title="Recepciones registradas">
          {recepciones.length === 0 && <p className="text-sm text-gray-400">Aún no hay recepciones.</p>}
          <div className="space-y-2">
            {recepciones.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="font-medium text-sm">OC {r.ordenCompra?.numero}</p>
                  <p className="text-xs text-gray-500">{new Date(r.fechaRecepcion).toLocaleDateString('es-PE')}</p>
                </div>
                <span className="text-xs text-gray-400">{r.detalles.length} ítems</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
