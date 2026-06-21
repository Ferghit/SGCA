'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { EstadoOCBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { OrdenCompra, HistorialOrdenCompra } from '@/types';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft, FileText, Download, User, Calendar, DollarSign, Package } from 'lucide-react';
import { ordenesCompraApi } from '@/lib/api';

export default function OrdenCompraDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showAprobarModal, setShowAprobarModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [justificacion, setJustificacion] = useState('');

  const isGerente = ['GERENTE', 'ADMIN'].includes(user?.rol || '');
  const canAprobar = isGerente && (orden?.estado === 'PENDIENTE_APROBACION' || orden?.estado === 'EN_REVISION');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await ordenesCompraApi.getById(Number(id));
        setOrden(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/ordenes-compra/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${orden?.numero}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleAprobar = async () => {
    if (!orden) return;
    setIsProcessing(true);
    try {
      const updated = await ordenesCompraApi.aprobar(orden.id, observaciones);
      setOrden(updated);
      setShowAprobarModal(false);
      setObservaciones('');
    } catch (error) {
      console.error('Error aprobar OC:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSolicitarRevision = async () => {
    if (!orden) return;
    setIsProcessing(true);
    try {
      const updated = await ordenesCompraApi.solicitarRevision(orden.id, justificacion);
      setOrden(updated);
      setShowRevisionModal(false);
      setJustificacion('');
    } catch (error) {
      console.error('Error solicitar revisión:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRechazar = async () => {
    if (!orden) return;
    setIsProcessing(true);
    try {
      const updated = await ordenesCompraApi.rechazar(orden.id, justificacion);
      setOrden(updated);
      setShowRechazarModal(false);
      setJustificacion('');
    } catch (error) {
      console.error('Error rechazar OC:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FileText className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-gray-500">Orden de compra no encontrada</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#006D77' }}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{orden.numero}</h1>
          <p className="text-sm text-gray-500">Orden de Compra</p>
        </div>
        <EstadoOCBadge estado={orden.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info principal */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1B263B' }}>Informacion General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Proveedor</p>
                    <p className="text-sm font-medium text-gray-700">{orden.proveedor.razonSocial}</p>
                    <p className="text-xs text-gray-500">{orden.proveedor.ruc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Fecha de Emision</p>
                    <p className="text-sm font-medium text-gray-700">{formatDate(orden.fechaEmision)}</p>
                    {orden.fechaEntregaEsperada && (
                      <p className="text-xs text-gray-500">Entrega estimada: {formatDate(orden.fechaEntregaEsperada)}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {orden.gerenteAprobador && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Aprobado por</p>
                      <p className="text-sm font-medium text-gray-700">{orden.gerenteAprobador.nombre} {orden.gerenteAprobador.apellido}</p>
                      {orden.fechaAprobacion && (
                        <p className="text-xs text-gray-500">Aprobado el: {formatDate(orden.fechaAprobacion)}</p>
                      )}
                    </div>
                  </div>
                )}
                {orden.condicionesComerciales && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Condiciones Comerciales</p>
                      <p className="text-sm text-gray-700">{orden.condicionesComerciales}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: '#1B263B' }}>Productos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">Descripcion</th>
                    <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Cantidad</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Precio Unitario</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orden.detalles.map((det) => (
                    <tr key={det.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{det.descripcion}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-center">{det.cantidad}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-right">{formatCurrency(det.precioUnitario)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800 text-right">{formatCurrency(det.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Subtotal</td>
                    <td colSpan={2} className="px-6 py-4 text-right text-sm text-gray-800">{formatCurrency(orden.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right text-sm font-semibold text-gray-700">IGV (18%)</td>
                    <td colSpan={2} className="px-6 py-4 text-right text-sm text-gray-800">{formatCurrency(orden.igv)}</td>
                  </tr>
                  <tr className="bg-white border-t border-gray-200">
                    <td colSpan={2} className="px-6 py-4 text-right text-lg font-bold" style={{ color: '#1B263B' }}>Total</td>
                    <td colSpan={2} className="px-6 py-4 text-right text-lg font-bold" style={{ color: '#1B263B' }}>{formatCurrency(orden.montoTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Historial */}
          {orden.historial && orden.historial.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#1B263B' }}>Historial</h2>
              <div className="space-y-4">
                {orden.historial.map((hist, idx) => (
                  <div key={hist.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center" style={{ backgroundColor: '#006D7720' }}>
                        <span className="text-xs font-bold" style={{ color: '#006D77' }}>{idx + 1}</span>
                      </div>
                      {idx < orden.historial.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-100" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {hist.estadoAnterior ? (
                          <>Cambio de estado: <span className="text-gray-400 line-through">{hist.estadoAnterior}</span> → <span className="text-secondary-DEFAULT font-semibold">{hist.estadoNuevo}</span></>
                        ) : (
                          <>Estado inicial: <span className="text-secondary-DEFAULT font-semibold">{hist.estadoNuevo}</span></>
                        )}
                      </p>
                      {hist.usuario && <p className="text-xs text-gray-500">{hist.usuario.nombre} {hist.usuario.apellido}</p>}
                      <p className="text-xs text-gray-400">{formatDateTime(hist.createdAt)}</p>
                      {hist.observaciones && <p className="text-xs text-gray-600 mt-1 italic">{hist.observaciones}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Acciones */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Acciones</h3>
            <div className="space-y-3">
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                onClick={handleDownloadPdf}
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              {canAprobar && (
                <>
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: '#22c55e' }}
                    onClick={() => setShowAprobarModal(true)}
                  >
                    Aprobar
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                    onClick={() => setShowRevisionModal(true)}
                  >
                    Solicitar Revision
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                    onClick={() => setShowRechazarModal(true)}
                  >
                    Rechazar
                  </button>
                </>
              )}
              {isGerente && orden.estado === 'PENDIENTE_APROBACION' && (
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#1B263B' }}
                  onClick={() => router.push(`/ordenes-compra/${orden.id}/expediente`)}
                >
                  <FileText className="w-4 h-4" />
                  Ver Expediente
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showAprobarModal}
        onClose={() => setShowAprobarModal(false)}
        title="Aprobar Orden de Compra"
        footer={
          <>
            <button onClick={() => setShowAprobarModal(false)} disabled={isProcessing} className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleAprobar} disabled={isProcessing} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#22c55e' }}>
              {isProcessing ? 'Procesando...' : 'Aprobar'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones (opcional)</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            rows={4}
            placeholder="Agregue observaciones si lo desea..."
          />
        </div>
      </Modal>

      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Solicitar Revisión"
        footer={
          <>
            <button onClick={() => setShowRevisionModal(false)} disabled={isProcessing} className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleSolicitarRevision} disabled={isProcessing || !justificacion.trim()} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#f59e0b' }}>
              {isProcessing ? 'Procesando...' : 'Solicitar'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Justificación</label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            rows={4}
            placeholder="Explique por qué solicita revisión..."
          />
        </div>
      </Modal>

      <Modal
        isOpen={showRechazarModal}
        onClose={() => setShowRechazarModal(false)}
        title="Rechazar Orden de Compra"
        footer={
          <>
            <button onClick={() => setShowRechazarModal(false)} disabled={isProcessing} className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleRechazar} disabled={isProcessing || !justificacion.trim()} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#ef4444' }}>
              {isProcessing ? 'Procesando...' : 'Rechazar'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Justificación</label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006D77' } as React.CSSProperties}
            rows={4}
            placeholder="Explique por qué rechaza la orden..."
          />
        </div>
      </Modal>
    </div>
  );
}
