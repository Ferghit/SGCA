'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card } from '@/components/ui/Card';
import { ChevronRight, Eye, Package } from 'lucide-react';

type Tab = 'pendientes' | 'registradas';

export default function RecepcionesPage() {
  const {
    ordenesPendientes,
    recepciones,
    fetchOrdenesPendientes,
    fetchRecepciones,
    isLoading,
    isLoadingRecepciones,
  } = useAlmacenStore();
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
          {isLoadingRecepciones && <p className="text-sm text-gray-400">Cargando recepciones...</p>}
          {!isLoadingRecepciones && recepciones.length === 0 && <p className="text-sm text-gray-400">Aún no hay recepciones.</p>}
          <div className="space-y-2">
            {recepciones.map((r) => (
              <Link
                key={r.id}
                href={`/recepciones/registradas/${r.id}`}
                className="group flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:border-teal-200 hover:bg-teal-50/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">Recepción #{r.id} · OC {r.ordenCompra?.numero}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.fechaRecepcion).toLocaleDateString('es-PE')} · {r.ordenCompra?.proveedor?.razonSocial}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs text-gray-400 sm:inline">{r.detalles.length} ítems</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-teal-700">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Ver detalle</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
