'use client';

import { useEffect, useState } from 'react';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card } from '@/components/ui/Card';

export default function DevolucionesPage() {
  const { devoluciones, recepciones, fetchDevoluciones, fetchRecepciones, registrarDevolucion } = useAlmacenStore();
  const [form, setForm] = useState({ recepcionId: '', descripcion: '', cantidad: '', motivo: '' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetchDevoluciones();
    fetchRecepciones();
  }, []);

  const enviar = async () => {
    if (!form.recepcionId || !form.descripcion || !form.cantidad || !form.motivo) return;
    setEnviando(true);
    try {
      await registrarDevolucion({
        recepcionId: Number(form.recepcionId),
        descripcion: form.descripcion,
        cantidad: Number(form.cantidad),
        motivo: form.motivo,
      });
      setForm({ recepcionId: '', descripcion: '', cantidad: '', motivo: '' });
      fetchDevoluciones();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-DEFAULT">Devoluciones a Proveedor</h1>

      <Card title="Registrar devolución">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            className="border rounded-lg px-2 py-1.5 text-sm"
            value={form.recepcionId}
            onChange={(e) => setForm({ ...form, recepcionId: e.target.value })}
          >
            <option value="">Selecciona recepción</option>
            {recepciones.map((r) => (
              <option key={r.id} value={r.id}>
                OC {r.ordenCompra?.numero} — Recepción #{r.id}
              </option>
            ))}
          </select>
          <input
            className="border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Producto / descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <input
            className="border rounded-lg px-2 py-1.5 text-sm"
            type="number"
            placeholder="Cantidad"
            value={form.cantidad}
            onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
          />
          <input
            className="border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Motivo (ej: producto dañado)"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
          />
        </div>
        <button
          onClick={enviar}
          disabled={enviando}
          className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#006D77' }}
        >
          {enviando ? 'Registrando...' : 'Registrar y notificar proveedor'}
        </button>
      </Card>

      <Card title="Historial de devoluciones">
        {devoluciones.length === 0 && <p className="text-sm text-gray-400">No hay devoluciones registradas.</p>}
        <div className="space-y-2">
          {devoluciones.map((d) => (
            <div key={d.id} className="flex justify-between text-sm border-b border-gray-50 pb-2">
              <span>{d.descripcion} ({d.cantidad}) — {d.motivo}</span>
              <span className={d.notificada ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {d.notificada ? 'Proveedor notificado' : 'Sin notificar'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
