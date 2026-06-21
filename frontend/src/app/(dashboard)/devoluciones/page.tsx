'use client';

import { useEffect, useState } from 'react';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card } from '@/components/ui/Card';
import { Recepcion, RecepcionDetalle } from '@/types';
import { Package, Truck, AlertTriangle, Send } from 'lucide-react';

type Tab = 'nueva' | 'historial';

export default function DevolucionesPage() {
  const { 
    devoluciones, 
    recepciones, 
    fetchDevoluciones, 
    fetchRecepciones, 
    registrarDevolucion, 
    isLoading, 
    isLoadingDevoluciones, 
    isLoadingRecepciones, 
    error, 
    errorDevoluciones 
  } = useAlmacenStore();
  
  const [form, setForm] = useState({ 
    recepcionId: '', 
    productoId: '', 
    descripcion: '', 
    cantidad: '', 
    motivo: '' 
  });
  
  const [selectedRecepcion, setSelectedRecepcion] = useState<Recepcion | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('nueva');

  useEffect(() => {
    fetchDevoluciones();
    fetchRecepciones();
  }, []);

  // When recepcionId changes, find the selected recepcion
  useEffect(() => {
    if (form.recepcionId) {
      const found = recepciones.find(r => r.id === Number(form.recepcionId));
      setSelectedRecepcion(found || null);
    } else {
      setSelectedRecepcion(null);
    }
  }, [form.recepcionId, recepciones]);

  const enviar = async () => {
    if (!form.recepcionId || !form.descripcion || !form.cantidad || !form.motivo) {
      alert('Por favor, completa todos los campos');
      return;
    }
    
    try {
      await registrarDevolucion({
        recepcionId: Number(form.recepcionId),
        descripcion: form.descripcion,
        cantidad: Number(form.cantidad),
        motivo: form.motivo,
        productoId: form.productoId ? Number(form.productoId) : undefined
      });
      
      // Reset form and refresh data
      setForm({ recepcionId: '', descripcion: '', cantidad: '', motivo: '', productoId: '' });
      setSelectedRecepcion(null);
      fetchDevoluciones();
      // Switch to historial tab after creating
      setActiveTab('historial');
    } catch (err) {
      console.error('Error registrando devolucion:', err);
    }
  };

  // Helper to select a detalle from the selected recepcion
  const selectDetalle = (detalle: RecepcionDetalle) => {
    setForm(prev => ({
      ...prev,
      descripcion: detalle.descripcion,
      productoId: detalle.productoId ? String(detalle.productoId) : '',
      cantidad: String(detalle.cantidadRecibida)
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-DEFAULT">Devoluciones a Proveedor</h1>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {errorDevoluciones && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
          <p className="text-sm font-medium">{errorDevoluciones}</p>
        </div>
      )}

      {/* Tabs selector */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('nueva')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'nueva'
              ? 'text-secondary-DEFAULT border-b-2 border-secondary-DEFAULT bg-secondary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          style={{ '--tw-text-opacity': '1', color: activeTab === 'nueva' ? '#006D77' : undefined } as React.CSSProperties}
        >
          Nueva Devolución
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'historial'
              ? 'text-secondary-DEFAULT border-b-2 border-secondary-DEFAULT bg-secondary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          style={{ '--tw-text-opacity': '1', color: activeTab === 'historial' ? '#006D77' : undefined } as React.CSSProperties}
        >
          Historial
        </button>
      </div>

      {activeTab === 'nueva' && (
        <Card title="Registrar devolución">
          <div className="space-y-6">
            {/* Select Recepcion */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Truck className="w-4 h-4 text-secondary-DEFAULT" style={{ color: '#006D77' }} />
                Recepción
              </label>
              {isLoadingRecepciones ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-secondary-DEFAULT border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }}></div>
                  Cargando recepciones...
                </div>
              ) : (
                <select
                  className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 text-sm focus:border-secondary-DEFAULT focus:ring-2 focus:ring-secondary-50 outline-none transition-all"
                  style={{ '--tw-ring-color': '#006D77', '--tw-border-opacity': '1', borderColor: form.recepcionId ? '#006D77' : undefined } as React.CSSProperties}
                  value={form.recepcionId}
                  onChange={(e) => setForm({ ...form, recepcionId: e.target.value })}
                >
                  <option value="">Selecciona recepción</option>
                  {recepciones.map((r) => (
                    <option key={r.id} value={r.id}>
                      OC {r.ordenCompra?.numero || 'N/A'} — Recepción #{r.id} — {new Date(r.fechaRecepcion).toLocaleDateString('es-PE')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Select Producto */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Package className="w-4 h-4 text-secondary-DEFAULT" style={{ color: '#006D77' }} />
                  Producto / Descripción
                </label>
                {selectedRecepcion ? (
                  <select
                    className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 text-sm focus:border-secondary-DEFAULT focus:ring-2 focus:ring-secondary-50 outline-none transition-all"
                    style={{ '--tw-ring-color': '#006D77', '--tw-border-opacity': '1', borderColor: form.descripcion ? '#006D77' : undefined } as React.CSSProperties}
                    value={form.descripcion}
                    onChange={(e) => {
                      const detalle = selectedRecepcion.detalles.find(d => d.descripcion === e.target.value);
                      if (detalle) {
                        selectDetalle(detalle);
                      } else {
                        setForm({ ...form, descripcion: e.target.value });
                      }
                    }}
                  >
                    <option value="">Selecciona producto</option>
                    {selectedRecepcion.detalles.map((det) => (
                      <option key={det.id} value={det.descripcion}>
                        {det.producto ? `${det.producto.nombre} (${det.producto.codigo}) — Recibido: ${det.cantidadRecibida}` : `${det.descripcion} (Recibido: ${det.cantidadRecibida})`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 text-sm focus:border-secondary-DEFAULT focus:ring-2 focus:ring-secondary-50 outline-none transition-all"
                    placeholder="Ingresa descripción del producto"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                )}
              </div>
              
              {/* Cantidad */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <AlertTriangle className="w-4 h-4 text-secondary-DEFAULT" style={{ color: '#006D77' }} />
                  Cantidad
                </label>
                <input
                  className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 text-sm focus:border-secondary-DEFAULT focus:ring-2 focus:ring-secondary-50 outline-none transition-all"
                  style={{ '--tw-ring-color': '#006D77', '--tw-border-opacity': '1', borderColor: form.cantidad ? '#006D77' : undefined } as React.CSSProperties}
                  type="number"
                  placeholder="0"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                />
              </div>

              {/* Motivo */}
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <AlertTriangle className="w-4 h-4 text-secondary-DEFAULT" style={{ color: '#006D77' }} />
                  Motivo de la devolución
                </label>
                <textarea
                  className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 text-sm focus:border-secondary-DEFAULT focus:ring-2 focus:ring-secondary-50 outline-none transition-all resize-y min-h-[100px]"
                  style={{ '--tw-ring-color': '#006D77', '--tw-border-opacity': '1', borderColor: form.motivo ? '#006D77' : undefined } as React.CSSProperties}
                  placeholder="Describe el motivo (ej: producto dañado, incorrecto, etc.)"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={enviar}
            disabled={isLoading}
            className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#006D77' }}
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Registrando...' : 'Registrar y notificar proveedor'}
          </button>
        </Card>
      )}

      {activeTab === 'historial' && (
        <Card title="Historial de devoluciones">
          {isLoadingDevoluciones ? (
            <p className="text-sm text-gray-400">Cargando devoluciones...</p>
          ) : devoluciones.length === 0 ? (
            <p className="text-sm text-gray-400">No hay devoluciones registradas.</p>
          ) : (
            <div className="space-y-2">
              {devoluciones.map((d) => (
                <div key={d.id} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <div>
                    <p>{d.descripcion} ({d.cantidad}) — {d.motivo}</p>
                    <p className="text-xs text-gray-400">
                      {d.recepcion ? `OC ${d.recepcion.ordenCompra?.numero} — Recepción #${d.recepcion.id}` : ''}
                    </p>
                  </div>
                  <span className={d.notificada ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {d.notificada ? 'Proveedor notificado' : 'Sin notificar'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
