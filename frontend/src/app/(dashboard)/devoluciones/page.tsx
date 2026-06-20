'use client';

import { useEffect, useState } from 'react';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card } from '@/components/ui/Card';
import { Recepcion, RecepcionDetalle } from '@/types';

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
    descripcion: '', 
    cantidad: '', 
    motivo: '',
    productoId: ''
  });
  
  const [selectedRecepcion, setSelectedRecepcion] = useState<Recepcion | null>(null);

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

      <Card title="Registrar devolución">
        <div className="space-y-4">
          {/* Select Recepcion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recepción</label>
            {isLoadingRecepciones ? (
              <p className="text-sm text-gray-400">Cargando recepciones...</p>
            ) : (
              <select
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
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

          {/* Show selected recepcion's detalles to auto-fill */}
          {selectedRecepcion && (
            <div className="border border-gray-100 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Productos de la recepción:</p>
              <div className="space-y-1">
                {selectedRecepcion.detalles.map((det) => (
                  <button
                    key={det.id}
                    onClick={() => selectDetalle(det)}
                    className="w-full text-left text-sm p-2 rounded-md hover:bg-gray-50 border border-gray-100"
                  >
                    {det.descripcion} (Recibido: {det.cantidadRecibida})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto / descripción</label>
              <input
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
                placeholder="Producto / descripción"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
                type="number"
                placeholder="Cantidad"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <input
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
                placeholder="Motivo (ej: producto dañado)"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={enviar}
          disabled={isLoading}
          className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#006D77' }}
        >
          {isLoading ? 'Registrando...' : 'Registrar y notificar proveedor'}
        </button>
      </Card>

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
    </div>
  );
}
