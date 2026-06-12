'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRequerimientosStore } from '@/store/requerimientosStore';
import { EstadoBadge, PrioridadBadge } from '@/components/ui/Badge';
import { formatDate, formatDateTime, ESTADO_CONFIG } from '@/lib/utils';
import { ArrowLeft, Send, CheckCircle, XCircle, RotateCcw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RequerimientoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const user = useAuthStore((s) => s.user);
  const { currentRequerimiento: req, fetchById, enviarParaAprobacion, updateEstado, isLoading } =
    useRequerimientosStore();

  const [comentario, setComentario] = useState('');
  const [showModal, setShowModal] = useState<'aprobar' | 'rechazar' | 'revision' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isJefe = ['JEFE_AREA', 'ADMIN', 'GERENTE'].includes(user?.rol || '');
  const isTrabajador = user?.rol === 'TRABAJADOR';
  const isOwner = req?.solicitante.id === user?.id;

  useEffect(() => {
    fetchById(id);
  }, [id]);

  const handleEnviar = async () => {
    setActionLoading(true);
    setError('');
    try {
      await enviarParaAprobacion(id);
      setSuccess('Requerimiento enviado para aprobacion.');
      await fetchById(id);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccion = async (estado: string) => {
    setActionLoading(true);
    setError('');
    try {
      await updateEstado(id, { estado, comentario: comentario.trim() || undefined });
      setSuccess(`Requerimiento ${estado.toLowerCase()} exitosamente.`);
      setShowModal(null);
      setComentario('');
      await fetchById(id);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && !req) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Requerimiento no encontrado.</p>
        <Link href="/requerimientos" className="text-sm text-secondary-DEFAULT mt-2 inline-block" style={{ color: '#006D77' }}>
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/requerimientos" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title font-mono">{req.codigo}</h1>
              <EstadoBadge estado={req.estado} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Creado el {formatDate(req.createdAt)} &bull; Actualizado {formatDate(req.updatedAt)}
            </p>
          </div>
        </div>
        <PrioridadBadge prioridad={req.prioridad} />
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info general */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="section-title mb-4">Informacion General</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Solicitante</p>
                <p className="font-semibold text-gray-800 mt-1">{req.solicitante.nombre} {req.solicitante.apellido}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fecha Requerida</p>
                <p className="font-semibold text-gray-800 mt-1">{formatDate(req.fechaRequerida)}</p>
              </div>
              {req.aprobador && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Procesado por</p>
                  <p className="font-semibold text-gray-800 mt-1">{req.aprobador.nombre} {req.aprobador.apellido}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Productos</p>
                <p className="font-semibold text-gray-800 mt-1">{req.detalles.length} item{req.detalles.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {req.descripcion && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Descripcion / Justificacion</p>
                <p className="text-sm text-gray-700 leading-relaxed">{req.descripcion}</p>
              </div>
            )}

            {req.comentarioJefe && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Comentario del Jefe de Area</p>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">{req.comentarioJefe}</p>
                </div>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="section-title mb-4">Productos Solicitados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-500 font-semibold pb-2 uppercase tracking-wide">Producto</th>
                    <th className="text-right text-xs text-gray-500 font-semibold pb-2 uppercase tracking-wide">Cantidad</th>
                    <th className="text-left text-xs text-gray-500 font-semibold pb-2 pl-3 uppercase tracking-wide">Unidad</th>
                    <th className="text-left text-xs text-gray-500 font-semibold pb-2 pl-3 uppercase tracking-wide">Observacion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {req.detalles.map((det) => (
                    <tr key={det.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-800">{det.producto.nombre}</p>
                        <p className="text-xs text-gray-400">{det.producto.codigo} &bull; {det.producto.categoria}</p>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">{det.cantidad}</td>
                      <td className="py-2.5 pl-3 text-gray-600">{det.unidadMedida}</td>
                      <td className="py-2.5 pl-3 text-gray-500 italic text-xs">{det.observacion || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Acciones del Jefe de Area */}
          {isJefe && req.estado === 'PENDIENTE' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <h2 className="section-title mb-1">Procesar Requerimiento</h2>
              <p className="text-sm text-gray-500 mb-4">Revisa el requerimiento y toma una decision.</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal('aprobar')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Aprobar
                </button>
                <button
                  onClick={() => setShowModal('rechazar')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
                <button
                  onClick={() => setShowModal('revision')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Solicitar Correccion
                </button>
              </div>
            </div>
          )}

          {/* Acciones del Trabajador */}
          {isTrabajador && isOwner && (req.estado === 'BORRADOR' || req.estado === 'EN_REVISION') && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <h2 className="section-title mb-1">Enviar para Aprobacion</h2>
              <p className="text-sm text-gray-500 mb-4">
                {req.estado === 'EN_REVISION'
                  ? 'El Jefe de Area ha solicitado correcciones. Una vez listo, envia nuevamente.'
                  : 'Cuando el requerimiento este listo, envialo al Jefe de Area para su revision.'}
              </p>
              <button
                onClick={handleEnviar}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#006D77' }}
              >
                <Send className="w-4 h-4" />
                {actionLoading ? 'Enviando...' : 'Enviar para Aprobacion'}
              </button>
            </div>
          )}
        </div>

        {/* Panel lateral - Historial */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="section-title mb-4">Historial de Estados</h2>
            <div className="relative">
              {req.historial.map((h, idx) => {
                const config = ESTADO_CONFIG[h.estadoNuevo];
                return (
                  <div key={h.id} className="flex gap-3 mb-4 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${config.bgColor} border-2 ${config.borderColor}`} />
                      {idx < req.historial.length - 1 && (
                        <div className="w-0.5 bg-gray-200 flex-1 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <EstadoBadge estado={h.estadoNuevo} size="sm" />
                      </div>
                      {h.comentario && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{h.comentario}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(h.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de accion */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-primary-DEFAULT mb-2">
              {showModal === 'aprobar' && 'Aprobar Requerimiento'}
              {showModal === 'rechazar' && 'Rechazar Requerimiento'}
              {showModal === 'revision' && 'Solicitar Correcciones'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {showModal === 'aprobar' && 'El requerimiento sera aprobado y pasara al proceso de compra.'}
              {showModal === 'rechazar' && 'El requerimiento sera rechazado. Por favor indica el motivo.'}
              {showModal === 'revision' && 'El requerimiento se devolvera al solicitante con tus observaciones.'}
            </p>
            <div className="mb-4">
              <label className="label-field">
                Comentario {showModal !== 'aprobar' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Escribe tu comentario aqui..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowModal(null); setComentario(''); }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (showModal !== 'aprobar' && !comentario.trim()) {
                    return setError('El comentario es obligatorio para esta accion.');
                  }
                  const estadoMap = { aprobar: 'APROBADO', rechazar: 'RECHAZADO', revision: 'EN_REVISION' };
                  handleAccion(estadoMap[showModal]);
                }}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50 ${
                  showModal === 'aprobar' ? 'bg-green-600 hover:bg-green-700' :
                  showModal === 'rechazar' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {actionLoading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
