'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCotizacionesStore } from '@/store/cotizacionesStore';
import api from '@/lib/api';
import { Requerimiento } from '@/types';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import Link from 'next/link';

interface ItemForm {
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  cantidadSolicitada?: number;
  stockDisponible?: number;
}

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
      setItems(req.detalles
        .filter((d) => Number(d.cantidadACotizar ?? d.cantidad) > 0)
        .map((d) => ({
          descripcion: d.producto?.nombre || '',
          cantidad: Number(d.cantidadACotizar ?? d.cantidad),
          unidadMedida: d.unidadMedida,
          cantidadSolicitada: Number(d.cantidadSolicitada ?? d.cantidad),
          stockDisponible: Number(d.stockDisponible ?? 0),
        })));
    }
  };

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
            <div>
              <h2 className="font-semibold text-gray-800">Faltantes por cotizar</h2>
              <p className="text-xs text-gray-500 mt-0.5">Se descuenta automáticamente el stock disponible.</p>
            </div>
            <PackageCheck className="w-5 h-5" style={{ color: '#006D77' }} />
          </div>

          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-lg border border-gray-100 p-3 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Producto</p>
                <p className="font-medium text-gray-800">{item.descripcion}</p>
              </div>
              <div><p className="text-xs text-gray-500">Solicitado</p><p>{item.cantidadSolicitada}</p></div>
              <div><p className="text-xs text-gray-500">En stock</p><p className="text-green-700">{item.stockDisponible}</p></div>
              <div><p className="text-xs text-gray-500">A cotizar</p><p className="font-bold" style={{ color: '#006D77' }}>{item.cantidad} {item.unidadMedida}</p></div>
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
