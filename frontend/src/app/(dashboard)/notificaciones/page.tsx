'use client';

import { useEffect, useState } from 'react';
import { notificacionesApi } from '@/lib/api';
import { Notificacion } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Bell, CheckCheck, Mail, MailOpen, History, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewHistorial, setViewHistorial] = useState(false);

  const fetchNotifs = async () => {
    try {
      const data = viewHistorial
        ? await notificacionesApi.getHistorial()
        : await notificacionesApi.getAll();
      setNotificaciones(data);
    } catch {
      // silencioso
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, [viewHistorial]);

  const marcarLeida = async (id: number) => {
    await notificacionesApi.marcarLeida(id);
    // Si estamos en vista de no leídas, remover la notificación
    if (!viewHistorial) {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    } else {
      setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
    }
  };

  const marcarTodasLeidas = async () => {
    await notificacionesApi.marcarTodasLeidas();
    if (!viewHistorial) {
      setNotificaciones([]);
    } else {
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            {viewHistorial ? 'Historial de Notificaciones' : 'Notificaciones'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {viewHistorial
              ? `${notificaciones.length} notificaciones en total`
              : noLeidas > 0
              ? `${noLeidas} sin leer`
              : 'Todas leidas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!viewHistorial && noLeidas > 0 && (
            <button
              onClick={marcarTodasLeidas}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como leidas
            </button>
          )}
          <button
            onClick={() => setViewHistorial(!viewHistorial)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            {viewHistorial ? (
              <>
                <ArrowLeft className="w-4 h-4" />
                Volver
              </>
            ) : (
              <>
                <History className="w-4 h-4" />
                Historial
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell className="w-14 h-14 mb-4 opacity-20" />
            <p className="font-medium text-gray-500">
              {viewHistorial ? 'No hay notificaciones en el historial' : 'No tienes notificaciones'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notificaciones.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 transition-colors ${!n.leida ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${!n.leida ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {n.leida ? <MailOpen className="w-4 h-4 text-gray-400" /> : <Mail className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.leida ? 'text-primary-DEFAULT' : 'text-gray-700'}`}>
                      {n.titulo}
                    </p>
                    {!n.leida && (
                      <button
                        onClick={() => marcarLeida(n.id)}
                        className="text-xs text-blue-600 hover:underline flex-shrink-0"
                      >
                        Marcar leida
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.mensaje}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
                    {n.requerimiento && (
                      <Link
                        href={`/requerimientos/${n.requerimiento.id}`}
                        className="text-xs font-medium text-secondary-DEFAULT hover:underline"
                        style={{ color: '#006D77' }}
                      >
                        Ver {n.requerimiento.codigo}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
