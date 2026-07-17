'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCotizacionesStore } from '@/store/cotizacionesStore';
import { OfertaProveedor } from '@/types';
import { formatDateShort } from '@/lib/utils';
import { ArrowLeft, Send, FileText, Clock, CheckCircle2, Edit3 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

// Función para convertir valores Decimal/string a number
const toNumber = (value: any): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const EstadoOfertaBadge = ({ estado }: { estado: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    RECIBIDA: { label: 'Recibida', className: 'bg-blue-100 text-blue-700' },
    SELECCIONADA: { label: 'Seleccionada', className: 'bg-green-100 text-green-700' },
    RECHAZADA: { label: 'Rechazada', className: 'bg-red-100 text-red-700' },
  };
  const cfg = config[estado] || { label: estado, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

export default function EnviarOfertaPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { solicitudActual, fetchSolicitud, enviarOferta, isLoading, error } = useCotizacionesStore();

  const [miOferta, setMiOferta] = useState<OfertaProveedor | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
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
    if (user?.rol !== 'PROVEEDOR' && user?.rol !== 'ADMIN') {
      router.push('/cotizaciones');
      return;
    }
    fetchSolicitud(id);
  }, [id, user, router]);

  // Cuando se carga la solicitud, buscamos la oferta del proveedor
  useEffect(() => {
    if (solicitudActual?.ofertas && user) {
      // Buscamos la oferta del proveedor actual
      const oferta = solicitudActual.ofertas.find(
        (o) => o.proveedor.email === user.email
      );
      if (oferta) {
        setMiOferta(oferta);
        setForm({
          montoTotal: toNumber(oferta.montoTotal)?.toString() || '',
          plazoEntregaDias: oferta.plazoEntregaDias?.toString() || '',
          condicionesPago: oferta.condicionesPago || '',
          notasAdicionales: oferta.notasAdicionales || '',
          archivoAdjuntoUrl: oferta.archivoAdjuntoUrl || '',
        });
      }
    }
  }, [solicitudActual, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.montoTotal || toNumber(form.montoTotal)! <= 0)
      return setSubmitError('Ingresa un monto válido');
    if (!form.plazoEntregaDias || Number(form.plazoEntregaDias) < 1)
      return setSubmitError('Ingresa el plazo en días');
    if (solicitudActual?.plazoMaximoDias && Number(form.plazoEntregaDias) > solicitudActual.plazoMaximoDias)
      return setSubmitError(
        `El plazo máximo permitido para cumplir la fecha requerida es de ${solicitudActual.plazoMaximoDias} día(s)`,
      );

    try {
      await enviarOferta({
        solicitudCotizacionId: id,
        montoTotal: toNumber(form.montoTotal)!,
        plazoEntregaDias: Number(form.plazoEntregaDias),
        condicionesPago: form.condicionesPago || undefined,
        notasAdicionales: form.notasAdicionales || undefined,
        archivoAdjuntoUrl: form.archivoAdjuntoUrl || undefined,
      });
      setSuccess(true);
      setModoEdicion(false);
      // Actualizamos la solicitud para ver la oferta actualizada
      fetchSolicitud(id);
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  const sol = solicitudActual;
  const vencida = sol ? new Date(sol.fechaLimite) < new Date() : false;
  const puedeEditar = miOferta && sol?.estado === 'ABIERTA' && !vencida;

  if (!sol || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (success && !modoEdicion) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {miOferta ? '¡Cotización actualizada!' : '¡Cotización enviada!'}
        </h2>
        <p className="text-gray-500 text-sm">Tu oferta para <strong>{sol.titulo}</strong> ha sido registrada correctamente.</p>
        <div className="flex justify-center gap-3 mt-4">
          <Link href="/cotizaciones" className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Ver cotizaciones abiertas
          </Link>
          <Link href="/cotizaciones/mis-ofertas" className="px-5 py-2.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#006D77' }}>
            Ver mis cotizaciones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/cotizaciones/mis-ofertas" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="page-title">
            {miOferta ? (modoEdicion ? 'Editar Cotización' : 'Mi Cotización') : 'Enviar Cotización'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{sol.codigo} — {sol.titulo}</p>
        </div>
      </div>

      {/* Info de la solicitud */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Detalle de la Solicitud</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${vencida ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {vencida ? 'Plazo vencido' : sol.estado === 'ABIERTA' ? 'Abierta' : sol.estado}
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
                <span className="text-gray-500">{toNumber(item.cantidad)} {item.unidadMedida}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Si ya existe la oferta y no estamos en modo edición */}
      {miOferta && !modoEdicion ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Tu Oferta</h2>
            <div className="flex items-center gap-2">
              <EstadoOfertaBadge estado={miOferta.estado} />
              {puedeEditar && (
                <button
                  onClick={() => setModoEdicion(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#E8F4F5', color: '#006D77' }}
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Monto Total</p>
              <p className="text-lg font-semibold text-gray-900">
                S/. {toNumber(miOferta.montoTotal)?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Plazo de Entrega</p>
              <p className="text-lg font-semibold text-gray-900">
                {miOferta.plazoEntregaDias} días
              </p>
            </div>
          </div>

          {miOferta.condicionesPago && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Condiciones de Pago</p>
              <p className="text-sm text-gray-700">{miOferta.condicionesPago}</p>
            </div>
          )}

          {miOferta.notasAdicionales && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Notas Adicionales</p>
              <p className="text-sm text-gray-700">{miOferta.notasAdicionales}</p>
            </div>
          )}

          {miOferta.archivoAdjuntoUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Documento Adjunto
              </p>
              <a
                href={miOferta.archivoAdjuntoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
                style={{ color: '#006D77' }}
              >
                {miOferta.archivoAdjuntoUrl}
              </a>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">Enviado el {formatDateShort(miOferta.createdAt)}</p>
          </div>
        </div>
      ) : (
        // Si no hay oferta o estamos en modo edición
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">
            {modoEdicion ? 'Editar Tu Oferta' : 'Tu Oferta'}
          </h2>

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
                max={sol.plazoMaximoDias}
                placeholder="7"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
                required
              />
              {sol.plazoMaximoDias && (
                <p className="text-xs text-amber-600 mt-1">
                  Plazo máximo permitido: {sol.plazoMaximoDias} día(s), para cumplir la fecha solicitada.
                </p>
              )}
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

          {(vencida || sol.estado !== 'ABIERTA') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              {vencida
                ? 'No se puede enviar la cotización porque la fecha límite ya venció.'
                : `No se puede enviar la cotización porque la solicitud está ${sol.estado.toLowerCase()}.`}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            {modoEdicion && (
              <button
                type="button"
                onClick={() => {
                  setModoEdicion(false);
                  // Restablecemos el formulario a los valores de la oferta
                  if (miOferta) {
                    setForm({
                      montoTotal: toNumber(miOferta.montoTotal)?.toString() || '',
                      plazoEntregaDias: miOferta.plazoEntregaDias?.toString() || '',
                      condicionesPago: miOferta.condicionesPago || '',
                      notasAdicionales: miOferta.notasAdicionales || '',
                      archivoAdjuntoUrl: miOferta.archivoAdjuntoUrl || '',
                    });
                  }
                }}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            )}
            {!modoEdicion && !miOferta && (
              <Link href="/cotizaciones" className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </Link>
            )}
            <button
              type="submit"
              disabled={isLoading || vencida || sol.estado !== 'ABIERTA'}
              title={vencida ? 'La fecha límite de esta solicitud ya venció' : undefined}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: '#006D77' }}
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Guardando...' : modoEdicion ? 'Actualizar Cotización' : 'Enviar Cotización'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
