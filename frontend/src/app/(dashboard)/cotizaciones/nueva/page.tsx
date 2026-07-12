'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCotizacionesStore } from '@/store/cotizacionesStore';
import api from '@/lib/api';
import { Requerimiento } from '@/types';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ItemForm { descripcion: string; cantidad: number; unidadMedida: string; }

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { crearSolicitud, isLoading, error } = useCotizacionesStore();

  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [form, setForm] = useState({
    requerimientoId: '',
    titulo: '',
    descripcion: '',
    fechaLimite: '',
  });
  const [items, setItems] = useState<ItemForm[]>([{ descripcion: '', cantidad: 1, unidadMedida: 'unidad' }]);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (user?.rol !== 'ANALISTA_COMPRAS' && user?.rol !== 'ADMIN') router.push('/cotizaciones');
    api.get('/cotizaciones/requerimientos-aprobados').then(({ data }) => setRequerimientos(data));
  }, [router, user]);

  useEffect(() => {
    const preselectedId = searchParams.get('requerimientoId');
    if (!preselectedId || requerimientos.length === 0) return;

    const found = requerimientos.find((req) => req.id === Number(preselectedId));
    if (found) {
      handleSelectReq(preselectedId);
    }
  }, [requerimientos, searchParams]);

  // Pre-llenar items cuando selecciona un requerimiento
  const handleSelectReq = (id: string) => {
    setForm((f) => ({ ...f, requerimientoId: id }));
    const req = requerimientos.find((r) => r.id === Number(id));
    if (req?.detalles?.length) {
      setItems(req.detalles.map((d) => ({
        descripcion: d.producto?.nombre || '',
        cantidad: Number(d.cantidad),
        unidadMedida: d.unidadMedida,
      })));
    }
  };

  const addItem = () => setItems((prev) => [...prev, { descripcion: '', cantidad: 1, unidadMedida: 'unidad' }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof ItemForm, val: string | number) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.requerimientoId) return setSubmitError('Selecciona un requerimiento');
    if (!form.fechaLimite) return setSubmitError('Ingresa la fecha límite');
    if (items.some((it) => !it.descripcion.trim())) return setSubmitError('Completa la descripción de todos los ítems');

    try {
      await crearSolicitud({
        requerimientoId: Number(form.requerimientoId),
        titulo: form.titulo || `Cotización para REQ-${form.requerimientoId}`,
        descripcion: form.descripcion,
        fechaLimite: form.fechaLimite,
        items,
      });
      router.push('/cotizaciones');
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/cotizaciones" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="page-title">Nueva Solicitud de Cotización</h1>
          <p className="text-sm text-gray-500 mt-0.5">Publica una solicitud a partir de un requerimiento con aprobación gerencial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Información General</h2>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requerimiento Aprobado por Gerencia *</label>
            <select
              value={form.requerimientoId}
              onChange={(e) => handleSelectReq(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
              required
            >
              <option value="">Seleccionar requerimiento...</option>
              {requerimientos.map((r) => (
                <option key={r.id} value={r.id}>{r.codigo} — {r.descripcion || 'Sin descripción'}</option>
              ))}
            </select>
            {requerimientos.length === 0 && (
               <p className="text-xs text-amber-600 mt-1">No hay requerimientos con aprobación gerencial disponibles para cotizar</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Cotización de insumos de oficina Q3-2026"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Condiciones</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              placeholder="Condiciones especiales, especificaciones técnicas, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite de Recepción *</label>
            <input
              type="datetime-local"
              value={form.fechaLimite}
              onChange={(e) => setForm((f) => ({ ...f, fechaLimite: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
              required
            />
          </div>
        </div>

        {/* Ítems */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Ítems Requeridos</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: '#E8F4F5', color: '#006D77' }}
            >
              <Plus className="w-4 h-4" /> Agregar ítem
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => updateItem(i, 'descripcion', e.target.value)}
                  placeholder="Descripción del ítem"
                  className="sm:col-span-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
                />
                <input
                  type="number"
                  value={item.cantidad}
                  min={0.01}
                  step={0.01}
                  onChange={(e) => updateItem(i, 'cantidad', Number(e.target.value))}
                  placeholder="Cantidad"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
                />
                <input
                  type="text"
                  value={item.unidadMedida}
                  onChange={(e) => updateItem(i, 'unidadMedida', e.target.value)}
                  placeholder="Unidad (kg, unidad, etc.)"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
                />
              </div>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {(submitError || error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {submitError || error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Link href="/cotizaciones" className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#006D77' }}
          >
            {isLoading ? 'Publicando...' : 'Publicar Solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
}
