'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRequerimientosStore } from '@/store/requerimientosStore';
import { EstadoBadge, PrioridadBadge } from '@/components/ui/Badge';
import { formatDate, formatDateOnly, formatDateTime, ESTADO_CONFIG } from '@/lib/utils';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertCircle,
  Building2,
  FilePenLine,
  ClipboardPlus,
} from 'lucide-react';
import Link from 'next/link';

type ModalAction =
  | 'aprobar_jefe'
  | 'rechazar_jefe'
  | 'revision_jefe'
  | 'aprobar_gerente'
  | 'revision_gerente'
  | null;

export default function RequerimientoDetallePage() {
  const params = useParams();
  const id = Number(params.id);
  const user = useAuthStore((s) => s.user);
  const {
    currentRequerimiento: req,
    fetchById,
    enviarParaAprobacion,
    updateEstado,
    isLoading,
  } = useRequerimientosStore();

  const [comentario, setComentario] = useState('');
  const [showModal, setShowModal] = useState<ModalAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = req?.solicitante.id === user?.id;
  const canProcessAsJefe = ['JEFE_AREA', 'ADMIN'].includes(user?.rol || '') && req?.estado === 'PENDIENTE';
  const canProcessAsGerente = ['GERENTE', 'ADMIN'].includes(user?.rol || '') && req?.estado === 'APROBADO';
  const canEdit = isOwner && ['BORRADOR', 'EN_REVISION'].includes(req?.estado || '');
  const canGenerateCotizacion =
    ['ANALISTA_COMPRAS', 'ADMIN'].includes(user?.rol || '') && req?.estado === 'APROBADO_GERENTE';

  const latestObservation = useMemo(() => {
    if (!req) return '';

    const historialObservacion = [...req.historial]
      .reverse()
      .find((item) => item.estadoNuevo === 'EN_REVISION' && item.comentario?.trim());

    return historialObservacion?.comentario || req.comentarioJefe || '';
  }, [req]);

  useEffect(() => {
    fetchById(id);
  }, [fetchById, id]);

  const handleEnviar = async () => {
    setActionLoading(true);
    setError('');
    try {
      await enviarParaAprobacion(id);
      setSuccess('Requerimiento enviado para aprobación.');
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
      const messageMap: Record<string, string> = {
        APROBADO: 'Requerimiento aprobado por Jefatura y enviado a Gerencia.',
        APROBADO_GERENTE: 'Requerimiento aprobado por Gerencia. Ya está listo para cotización.',
        RECHAZADO: 'Requerimiento rechazado.',
        EN_REVISION: 'Requerimiento enviado a observaciones.',
      };
      setSuccess(messageMap[estado] || `Requerimiento ${estado.toLowerCase()} exitosamente.`);
      setShowModal(null);
      setComentario('');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && !req) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#006D77', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Requerimiento no encontrado.</p>
        <Link
          href="/requerimientos"
          className="text-sm text-secondary-DEFAULT mt-2 inline-block"
          style={{ color: '#006D77' }}
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  const modalMeta: Record<Exclude<ModalAction, null>, { title: string; text: string; state: string; color: string }> = {
    aprobar_jefe: {
      title: 'Aprobar como Jefatura',
      text: 'El requerimiento pasará al estado APROBADO y quedará pendiente de aprobación gerencial.',
      state: 'APROBADO',
      color: 'bg-green-600 hover:bg-green-700',
    },
    rechazar_jefe: {
      title: 'Rechazar Requerimiento',
      text: 'El requerimiento quedará rechazado. Indica el motivo de rechazo.',
      state: 'RECHAZADO',
      color: 'bg-red-600 hover:bg-red-700',
    },
    revision_jefe: {
      title: 'Solicitar Correcciones',
      text: 'El requerimiento volverá al trabajador con observaciones para su corrección.',
      state: 'EN_REVISION',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    aprobar_gerente: {
      title: 'Aprobar Gerencialmente',
      text: 'El requerimiento quedará en APROBADO_GERENTE y podrá pasar a cotización.',
      state: 'APROBADO_GERENTE',
      color: 'bg-emerald-600 hover:bg-emerald-700',
    },
    revision_gerente: {
      title: 'Devolver con Observaciones',
      text: 'El requerimiento volverá a observaciones para que el trabajador lo ajuste.',
      state: 'EN_REVISION',
      color: 'bg-amber-600 hover:bg-amber-700',
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/requerimientos" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title font-mono">{req.codigo}</h1>
              <EstadoBadge estado={req.estado} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Creado el {formatDate(req.createdAt)} · Actualizado {formatDate(req.updatedAt)}
            </p>
          </div>
        </div>
        <PrioridadBadge prioridad={req.prioridad} />
      </div>

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
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="section-title mb-4">Información General</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Solicitante</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {req.solicitante.nombre} {req.solicitante.apellido}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fecha Requerida</p>
                <p className="font-semibold text-gray-800 mt-1">{formatDateOnly(req.fechaRequerida)}</p>
              </div>
              {req.aprobador && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Aprobado por Jefatura</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {req.aprobador.nombre} {req.aprobador.apellido}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Productos</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {req.detalles.length} item{req.detalles.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {req.descripcion && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                  Descripción / Justificación
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{req.descripcion}</p>
              </div>
            )}

            {latestObservation && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                  Observaciones de aprobación
                </p>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">{latestObservation}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="section-title mb-4">Productos Solicitados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-500 font-semibold pb-2 uppercase tracking-wide">
                      Producto
                    </th>
                    <th className="text-right text-xs text-gray-500 font-semibold pb-2 uppercase tracking-wide">
                      Cantidad
                    </th>
                    <th className="text-left text-xs text-gray-500 font-semibold pb-2 pl-3 uppercase tracking-wide">
                      Unidad
                    </th>
                    <th className="text-left text-xs text-gray-500 font-semibold pb-2 pl-3 uppercase tracking-wide">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {req.detalles.map((det) => (
                    <tr key={det.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-800">{det.producto.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {det.producto.codigo} · {det.producto.categoria}
                        </p>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">{det.cantidad}</td>
                      <td className="py-2.5 pl-3 text-gray-600">{det.unidadMedida}</td>
                      <td className="py-2.5 pl-3 text-gray-500 italic text-xs">
                        {det.observacion || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {canProcessAsJefe && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <h2 className="section-title mb-1">Revisión de Jefatura</h2>
              <p className="text-sm text-gray-500 mb-4">
                Si apruebas este requerimiento, quedará pendiente de aprobación gerencial.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal('aprobar_jefe')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Aprobar y pasar a Gerencia
                </button>
                <button
                  onClick={() => setShowModal('rechazar_jefe')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
                <button
                  onClick={() => setShowModal('revision_jefe')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Solicitar corrección
                </button>
              </div>
            </div>
          )}

          {canProcessAsGerente && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="section-title">Aprobación Gerencial</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Este requerimiento ya fue aprobado por Jefatura. Ahora debes aprobarlo para dejarlo listo para cotización o devolverlo con observaciones.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal('aprobar_gerente')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Aprobar Gerencia
                </button>
                <button
                  onClick={() => setShowModal('revision_gerente')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white font-medium text-sm rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Volver a observaciones
                </button>
              </div>
            </div>
          )}

          {canEdit && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <h2 className="section-title mb-1">Editar y reenviar</h2>
              <p className="text-sm text-gray-500 mb-4">
                {req.estado === 'EN_REVISION'
                  ? 'Corrige el contenido del requerimiento y luego vuelve a enviarlo a aprobación.'
                  : 'Puedes seguir ajustando este borrador antes de enviarlo.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/requerimientos/nuevo?edit=${req.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FilePenLine className="w-4 h-4" />
                  Editar requerimiento
                </Link>
                <button
                  onClick={handleEnviar}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#006D77' }}
                >
                  <Send className="w-4 h-4" />
                  {actionLoading ? 'Enviando...' : 'Enviar para aprobación'}
                </button>
              </div>
            </div>
          )}

          {canGenerateCotizacion && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <h2 className="section-title mb-1">Siguiente paso</h2>
              <p className="text-sm text-gray-500 mb-4">
                Este requerimiento ya cuenta con aprobación gerencial y puede pasar al proceso de cotización.
              </p>
              <Link
                href={`/cotizaciones/nueva?requerimientoId=${req.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors"
                style={{ backgroundColor: '#006D77' }}
              >
                <ClipboardPlus className="w-4 h-4" />
                Generar solicitud de cotización
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="section-title mb-4">Ruta de aprobación</h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-800">1. Envío del trabajador</p>
                <p className="text-gray-500 mt-1">
                  {['PENDIENTE', 'APROBADO', 'APROBADO_GERENTE'].includes(req.estado)
                    ? 'Completado'
                    : req.estado === 'BORRADOR'
                      ? 'Pendiente'
                      : 'Ya fue reenviado anteriormente'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-800">2. Aprobación de Jefatura</p>
                <p className="text-gray-500 mt-1">
                  {req.estado === 'PENDIENTE'
                    ? 'Pendiente'
                    : ['APROBADO', 'APROBADO_GERENTE'].includes(req.estado)
                      ? 'Aprobado'
                      : req.estado === 'RECHAZADO'
                        ? 'Rechazado'
                        : req.estado === 'EN_REVISION'
                          ? 'Observado'
                          : 'Pendiente'}
                </p>
              </div>
              {['GERENTE', 'ADMIN'].includes(user?.rol || '') && (
                <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50">
                  <p className="font-semibold text-emerald-800">3. Aprobación Gerencial</p>
                  <p className="text-emerald-700 mt-1">
                    {req.estado === 'APROBADO_GERENTE'
                      ? 'Aprobación final completada'
                      : req.estado === 'APROBADO'
                        ? 'Pendiente de su decisión'
                        : req.estado === 'EN_REVISION'
                          ? 'Devuelto con observaciones'
                          : 'Aún no disponible'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="section-title mb-4">Historial de Estados</h2>
            <div className="relative">
              {req.historial.map((h, idx) => {
                const config = ESTADO_CONFIG[h.estadoNuevo];
                return (
                  <div key={h.id} className="flex gap-3 mb-4 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${config.bgColor} border-2 ${config.borderColor}`}
                      />
                      {idx < req.historial.length - 1 && (
                        <div className="w-0.5 bg-gray-200 flex-1 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <EstadoBadge estado={h.estadoNuevo} size="sm" />
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-primary-DEFAULT mb-2">
              {modalMeta[showModal].title}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{modalMeta[showModal].text}</p>
            <div className="mb-4">
              <label className="label-field">
                Comentario
                {showModal !== 'aprobar_jefe' && showModal !== 'aprobar_gerente' && (
                  <span className="text-red-500"> *</span>
                )}
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Escribe tu comentario aquí..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(null);
                  setComentario('');
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (
                    ['rechazar_jefe', 'revision_jefe', 'revision_gerente'].includes(showModal) &&
                    !comentario.trim()
                  ) {
                    return setError('El comentario es obligatorio para esta acción.');
                  }
                  handleAccion(modalMeta[showModal].state);
                }}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50 transition-colors ${modalMeta[showModal].color}`}
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
