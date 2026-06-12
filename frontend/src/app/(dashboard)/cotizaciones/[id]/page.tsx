'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCotizacionesStore } from '@/store/cotizacionesStore';
import { OfertaProveedor, SolicitudCotizacion } from '@/types';
import { formatDateShort } from '@/lib/utils';
import {
  ArrowLeft, Award, Clock, CheckCircle2, XCircle,
  DollarSign, Truck, Star, Lock, Unlock,
} from 'lucide-react';
import Link from 'next/link';

export default function DetalleSolicitudPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { solicitudActual, fetchSolicitud, cerrarSolicitud, seleccionarGanador, isLoading } = useCotizacionesStore();

  const [ofertaSeleccionadaId, setOfertaSeleccionadaId] = useState<number | null>(null);
  const [justificacion, setJustificacion] = useState('');
  const [showJustif, setShowJustif] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const id = Number(params.id);
  const isAnalista = user?.rol === 'ANALISTA_COMPRAS' || user?.rol === 'ADMIN';

  useEffect(() => { fetchSolicitud(id); }, [id]);

  const sol = solicitudActual as SolicitudCotizacion | null;
  if (!sol || isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Función para convertir valores Decimal/string a number de forma segura
  const toNumber = (value: any): number | null => {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  const ofertasOrdenadas = [...(sol.ofertas || [])].sort((a, b) =>
    (toNumber(b.puntajeTotal) ?? 0) - (toNumber(a.puntajeTotal) ?? 0),
  );

  const recomendada = ofertasOrdenadas[0];
  const vencida = new Date(sol.fechaLimite) < new Date();

  const handleCerrar = async () => {
    setSaving(true);
    await cerrarSolicitud(id);
    setSaving(false);
    setToast('Solicitud cerrada. Se generó el ranking automáticamente.');
    setTimeout(() => setToast(''), 4000);
  };

  const handleSeleccionar = async () => {
    if (!ofertaSeleccionadaId) return;
    const esRecomendada = ofertaSeleccionadaId === recomendada?.id;
    if (!esRecomendada && !justificacion.trim()) {
      setShowJustif(true);
      return;
    }
    setSaving(true);
    await seleccionarGanador(id, { ofertaId: ofertaSeleccionadaId, justificacion });
    setSaving(false);
    setToast('Proveedor seleccionado correctamente. ¡La adjudicación quedó registrada!');
    setTimeout(() => setToast(''), 5000);
  };

  const ESTADO_BADGE: Record<string, string> = {
    ABIERTA: 'bg-green-100 text-green-700',
    CERRADA: 'bg-yellow-100 text-yellow-700',
    ADJUDICADA: 'bg-blue-100 text-blue-700',
    CANCELADA: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/cotizaciones" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#E8F4F5', color: '#006D77' }}>
              {sol.codigo}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_BADGE[sol.estado]}`}>
              {sol.estado}
            </span>
          </div>
          <h1 className="page-title mt-1">{sol.titulo}</h1>
        </div>
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Requerimiento</p>
          <p className="font-semibold text-gray-800">{sol.requerimiento?.codigo}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Fecha límite</p>
          <p className={`font-semibold ${vencida ? 'text-red-600' : 'text-gray-800'}`}>
            {formatDateShort(sol.fechaLimite)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Analista</p>
          <p className="font-semibold text-gray-800">{sol.analista?.nombre} {sol.analista?.apellido}</p>
        </div>
      </div>

      {/* Ítems */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Ítems Solicitados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Descripción</th>
                <th className="text-right py-2 text-gray-500 font-medium">Cantidad</th>
                <th className="text-right py-2 text-gray-500 font-medium">Unidad</th>
              </tr>
            </thead>
            <tbody>
              {sol.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-800">{item.descripcion}</td>
                  <td className="py-2 text-right text-gray-700">{Number(item.cantidad)}</td>
                  <td className="py-2 text-right text-gray-500">{item.unidadMedida}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acciones para analista */}
      {isAnalista && sol.estado === 'ABIERTA' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-amber-800 text-sm">
              {vencida ? 'El plazo ha vencido. Puedes cerrar manualmente.' : 'Solicitud abierta — esperando ofertas de proveedores.'}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">{sol.ofertas?.length ?? 0} oferta(s) recibida(s) hasta ahora</p>
          </div>
          {(vencida || sol.ofertas?.length > 0) && (
            <button
              onClick={handleCerrar}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shrink-0 transition-colors"
              style={{ backgroundColor: '#1B263B' }}
            >
              <Lock className="w-4 h-4" />
              {saving ? 'Cerrando...' : 'Cerrar y generar ranking'}
            </button>
          )}
        </div>
      )}

      {/* Comparador */}
      {(sol.estado === 'CERRADA' || sol.estado === 'ADJUDICADA') && ofertasOrdenadas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Reporte Comparativo de Proveedores</h2>
            <span className="text-xs text-gray-500">Ponderación: Precio 50% · Plazo 30% · Historial 20%</span>
          </div>

          <div className="space-y-3">
            {ofertasOrdenadas.map((oferta: OfertaProveedor, idx) => {
              const esRecomendada = idx === 0 && sol.estado !== 'ADJUDICADA';
              const esGanadora = sol.proveedorGanadorId === oferta.proveedorId;
              const seleccionada = ofertaSeleccionadaId === oferta.id;

              return (
                <div
                  key={oferta.id}
                  onClick={() => isAnalista && sol.estado === 'CERRADA' && setOfertaSeleccionadaId(oferta.id)}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    esGanadora
                      ? 'border-blue-400 bg-blue-50'
                      : seleccionada
                      ? 'border-green-400 bg-green-50'
                      : esRecomendada
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-100 bg-white'
                  } ${isAnalista && sol.estado === 'CERRADA' ? 'cursor-pointer hover:border-gray-300' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800">
                          #{oferta.posicionRanking ?? idx + 1} {oferta.proveedor.razonSocial}
                        </span>
                        {esRecomendada && (
                          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                            <Award className="w-3 h-3" /> Recomendado
                          </span>
                        )}
                        {esGanadora && (
                          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                            <CheckCircle2 className="w-3 h-3" /> Ganador
                          </span>
                        )}
                        {seleccionada && !esGanadora && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-200 text-green-800">
                            Seleccionado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">RUC: {oferta.proveedor.ruc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: '#006D77' }}>
                        {toNumber(oferta.puntajeTotal) != null ? toNumber(oferta.puntajeTotal)!.toFixed(1) : '—'}
                      </p>
                      <p className="text-xs text-gray-500">pts. totales</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Monto</p>
                      <p className="font-semibold text-gray-800">S/. {toNumber(oferta.montoTotal)?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-gray-400">Ptje: {toNumber(oferta.puntajePrecio)?.toFixed(1) ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Truck className="w-3 h-3" /> Plazo</p>
                      <p className="font-semibold text-gray-800">{oferta.plazoEntregaDias} días</p>
                      <p className="text-xs text-gray-400">Ptje: {toNumber(oferta.puntajePlazo)?.toFixed(1) ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Star className="w-3 h-3" /> Historial</p>
                      <p className="text-xs text-gray-400">Ptje: {toNumber(oferta.puntajeHistorial)?.toFixed(1) ?? '—'}</p>
                    </div>
                    {oferta.condicionesPago && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Condiciones</p>
                        <p className="text-xs text-gray-700">{oferta.condicionesPago}</p>
                      </div>
                    )}
                  </div>

                  {oferta.notasAdicionales && (
                    <p className="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
                      {oferta.notasAdicionales}
                    </p>
                  )}
                  {oferta.archivoAdjuntoUrl && (
                    <a href={oferta.archivoAdjuntoUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#006D77' }}>
                      Ver documento adjunto →
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selección / Justificación */}
          {isAnalista && sol.estado === 'CERRADA' && (
            <div className="mt-5 border-t border-gray-100 pt-4 space-y-3">
              {showJustif && ofertaSeleccionadaId !== recomendada?.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Justificación (requerida al elegir una opción diferente a la recomendada)
                  </label>
                  <textarea
                    value={justificacion}
                    onChange={(e) => setJustificacion(e.target.value)}
                    rows={3}
                    placeholder="Explica por qué seleccionas este proveedor sobre el recomendado..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
                  />
                </div>
              )}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-500">
                  {ofertaSeleccionadaId
                    ? `Proveedor seleccionado: ${ofertasOrdenadas.find((o) => o.id === ofertaSeleccionadaId)?.proveedor.razonSocial}`
                    : 'Haz clic en una oferta para seleccionar al ganador'}
                </p>
                <button
                  onClick={handleSeleccionar}
                  disabled={!ofertaSeleccionadaId || saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#006D77' }}
                >
                  <Award className="w-4 h-4" />
                  {saving ? 'Adjudicando...' : 'Confirmar adjudicación'}
                </button>
              </div>
            </div>
          )}

          {/* Justificación registrada */}
          {sol.justificacionSeleccion && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Justificación registrada:</p>
              <p className="text-sm text-blue-800">{sol.justificacionSeleccion}</p>
            </div>
          )}
        </div>
      )}

      {sol.estado === 'ABIERTA' && isAnalista && (sol.ofertas?.length ?? 0) === 0 && !vencida && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <Unlock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Esperando ofertas de proveedores…</p>
          <p className="text-gray-400 text-xs mt-1">El ranking se generará automáticamente al cerrar la solicitud.</p>
        </div>
      )}
    </div>
  );
}