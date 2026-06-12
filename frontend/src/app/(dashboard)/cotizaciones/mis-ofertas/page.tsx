'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCotizacionesStore } from '@/store/cotizacionesStore';
import { OfertaProveedor } from '@/types';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

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

const EstadoSolicitudBadge = ({ estado }: { estado: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    ABIERTA: { label: 'Abierta', className: 'bg-green-100 text-green-700' },
    CERRADA: { label: 'Cerrada', className: 'bg-yellow-100 text-yellow-700' },
    ADJUDICADA: { label: 'Adjudicada', className: 'bg-blue-100 text-blue-700' },
    CANCELADA: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
  };
  const cfg = config[estado] || { label: estado, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

export default function MisOfertasPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { fetchSolicitudes, isLoading, error } = useCotizacionesStore();
  const [misOfertas, setMisOfertas] = useState<OfertaProveedor[]>([]);
  const [loadingOfertas, setLoadingOfertas] = useState(true);

  useEffect(() => {
    if (!user || user.rol !== 'PROVEEDOR') {
      router.push('/dashboard');
      return;
    }
    // Cargamos las ofertas del proveedor
    const loadMisOfertas = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const res = await api.get('/cotizaciones/mis-ofertas');
        setMisOfertas(res.data);
      } catch (err) {
        console.error('Error loading mis ofertas:', err);
      } finally {
        setLoadingOfertas(false);
      }
    };
    loadMisOfertas();
  }, [user, router]);

  if (loadingOfertas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/cotizaciones" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="page-title">Mis Cotizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Historial de todas tus cotizaciones enviadas
          </p>
        </div>
      </div>

      {misOfertas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aún no has enviado ninguna cotización</p>
          <Link href="/cotizaciones" className="mt-3 inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#006D77' }}>
            Ver cotizaciones abiertas
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {misOfertas.map((oferta) => (
            <div key={oferta.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: '#E8F4F5', color: '#006D77' }}>
                      {oferta.solicitudCotizacion?.codigo}
                    </span>
                    <EstadoOfertaBadge estado={oferta.estado} />
                    {oferta.solicitudCotizacion && (
                      <EstadoSolicitudBadge estado={oferta.solicitudCotizacion.estado} />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {oferta.solicitudCotizacion?.titulo || 'Solicitud de cotización'}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>Monto: </span>
                      <span className="font-semibold text-gray-900">
                        S/. {toNumber(oferta.montoTotal)?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Plazo: </span>
                      <span className="font-semibold text-gray-900">{oferta.plazoEntregaDias} días</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Enviado: </span>
                      <span className="font-semibold text-gray-900">
                        {formatDateShort(oferta.createdAt)}
                      </span>
                    </div>
                  </div>
                  {oferta.condicionesPago && (
                    <p className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Condiciones:</span> {oferta.condicionesPago}
                    </p>
                  )}
                </div>
                <Link
                  href={`/cotizaciones/${oferta.solicitudCotizacionId}/oferta`}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#E8F4F5', color: '#006D77' }}
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
