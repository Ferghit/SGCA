'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCotizacionesStore } from '@/store/cotizacionesStore';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, Send, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

export default function EnviarOfertaPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { solicitudActual, fetchSolicitud, enviarOferta, isLoading, error } = useCotizacionesStore();

  const [form, setForm] = useState({
    montoTotal: '',
    plazoEntregaDias: '',
    condicionesPago: '',
    notasAdicionales: '',
    archivoAdjuntoUrl: '',
  });
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const id = Number(params.id);

  useEffect(() => {
    if (user?.rol !== 'PROVEEDOR' && user?.rol !== 'ADMIN') router.push('/cotizaciones');
    fetchSolicitud(id);
  }, [id, user]);

  const sol = solicitudActual;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.montoTotal || Number(form.montoTotal) <= 0) return setSubmitError('Ingresa un monto válido');
    if (!form.plazoEntregaDias || Number(form.plazoEntregaDias) < 1) return setSubmitError('Ingresa el plazo en días');

    try {
      await enviarOferta({
        solicitudCotizacionId: id,
        montoTotal: Number(form.montoTotal),
        plazoEntregaDias: Number(form.plazoEntregaDias),
        condicionesPago: form.condicionesPago || undefined,
        notasAdicionales: form.notasAdicionales || undefined,
        archivoAdjuntoUrl: form.archivoAdjuntoUrl || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  if (!sol || isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const vencida = new Date(sol.fechaLimite) < new Date();

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">¡Cotización enviada!</h2>
        <p className="text-gray-500 text-sm">Tu oferta para <strong>{sol.titulo}</strong> fue registrada correctamente.</p>
        <Link href="/cotizaciones" className="inline-block mt-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#006D77' }}>
          Ver más solicitudes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/cotizaciones" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="page-title">Enviar Cotización</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sol.codigo} — {sol.titulo}</p>
        </div>
      </div>

      {/* Info de la solicitud */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Detalle de la Solicitud</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${vencida ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {vencida ? 'Plazo vencido' : 'Abierta'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-gray-400" />
          Fecha límite: <strong className={vencida ? 'text-red-600' : ''}>{formatDateShort(sol.fechaLimite)}</strong>
        </div>
        {sol.descripcion && <p className="text-sm text-gray-600">{sol.descripcion}</p>}

        <div className="mt-2">
          <p className="text-xs font-medium text-gray-500 mb-2">Ítems requeridos:</p>
          <div className="space-y-1">
            {sol.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-700 py-1 border-b border-gray-50">
                <span>{item.descripcion}</span>
                <span className="text-gray-500">{Number(item.cantidad)} {item.unidadMedida}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {vencida ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">El plazo para enviar cotizaciones ha vencido.</p>
          <p className="text-red-500 text-sm mt-1">No es posible enviar más ofertas para esta solicitud.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Tu Oferta</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total (S/.) *</label>
              <input
                type="number"
                value={form.montoTotal}
                onChange={(e) => setForm((f) => ({ ...f, montoTotal: e.target.value }))}
                min={0.01}
                step={0.01}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plazo de Entrega (días) *</label>
              <input
                type="number"
                value={form.plazoEntregaDias}
                onChange={(e) => setForm((f) => ({ ...f, plazoEntregaDias: e.target.value }))}
                min={1}
                placeholder="7"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones de Pago</label>
            <input
              type="text"
              value={form.condicionesPago}
              onChange={(e) => setForm((f) => ({ ...f, condicionesPago: e.target.value }))}
              placeholder="Ej: 50% adelanto, 50% contra entrega"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
            <textarea
              value={form.notasAdicionales}
              onChange={(e) => setForm((f) => ({ ...f, notasAdicionales: e.target.value }))}
              rows={2}
              placeholder="Garantías, especificaciones del producto, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> URL de Documento Adjunto (PDF)</span>
            </label>
            <input
              type="url"
              value={form.archivoAdjuntoUrl}
              onChange={(e) => setForm((f) => ({ ...f, archivoAdjuntoUrl: e.target.value }))}
              placeholder="https://drive.google.com/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            />
            <p className="text-xs text-gray-400 mt-1">Pega el enlace público de tu cotización en PDF (Google Drive, Dropbox, etc.)</p>
          </div>

          {(submitError || error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {submitError || error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Link href="/cotizaciones" className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#006D77' }}
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Enviando...' : 'Enviar Cotización'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}