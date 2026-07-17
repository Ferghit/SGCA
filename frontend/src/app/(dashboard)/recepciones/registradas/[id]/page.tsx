'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Package,
  Truck,
  UserRound,
} from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { EstadoItemRecepcion, Recepcion } from '@/types';

const estadoItem: Record<EstadoItemRecepcion, { label: string; clase: string }> = {
  CONFORME: { label: 'Conforme', clase: 'bg-emerald-100 text-emerald-700' },
  DANADO: { label: 'Dañado', clase: 'bg-red-100 text-red-700' },
  FALTANTE: { label: 'Faltante', clase: 'bg-amber-100 text-amber-700' },
};

export default function RecepcionRegistradaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [recepcion, setRecepcion] = useState<Recepcion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true);
        setError('');
        const { data } = await api.get<Recepcion>(`/almacen/recepciones/${id}`);
        setRecepcion(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'No se pudo cargar el detalle de la recepción.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) cargar();
  }, [id]);

  const resumen = useMemo(() => {
    const detalles = recepcion?.detalles ?? [];
    return {
      esperados: detalles.reduce((total, item) => total + Number(item.cantidadEsperada), 0),
      recibidos: detalles.reduce((total, item) => total + Number(item.cantidadRecibida), 0),
      observados: detalles.filter((item) => item.estado !== 'CONFORME').length,
    };
  }, [recepcion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !recepcion) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-red-400" />
        <p className="font-medium text-red-800">{error || 'Recepción no encontrada.'}</p>
        <button onClick={() => router.push('/recepciones')} className="mt-5 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: '#006D77' }}>
          Volver a recepciones
        </button>
      </div>
    );
  }

  const orden = recepcion.ordenCompra;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => router.push('/recepciones')} className="rounded-lg p-2 transition-colors hover:bg-gray-100" aria-label="Volver a recepciones">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="page-title">Recepción #{recepcion.id}</h1>
          <p className="text-sm text-gray-500">Detalle registrado para la orden {orden.numero}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          {recepcion.estado || 'REGISTRADA'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Summary icon={<CalendarDays className="h-5 w-5" />} label="Fecha de recepción" value={formatDateTime(recepcion.fechaRecepcion)} />
        <Summary icon={<Truck className="h-5 w-5" />} label="Proveedor" value={orden.proveedor?.razonSocial || 'Sin proveedor'} />
        <Summary icon={<Package className="h-5 w-5" />} label="Unidades recibidas" value={`${resumen.recibidos} de ${resumen.esperados}`} />
        <Summary icon={<ClipboardCheck className="h-5 w-5" />} label="Resultado" value={resumen.observados === 0 ? 'Todo conforme' : `${resumen.observados} ítem(s) observado(s)`} />
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Información de la recepción</h2>
            <p className="mt-1 text-sm text-gray-500">Datos generales registrados por almacén.</p>
          </div>
          <Link href={`/ordenes-compra/${orden.id}`} className="inline-flex items-center gap-2 rounded-lg border border-teal-200 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50">
            <FileText className="h-4 w-4" />
            Ver orden {orden.numero}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-3">
          <Info label="Orden de compra" value={orden.numero} />
          <Info label="Responsable" value={recepcion.responsable ? `${recepcion.responsable.nombre} ${recepcion.responsable.apellido}` : 'No registrado'} icon={<UserRound className="h-4 w-4" />} />
          <Info label="RUC del proveedor" value={orden.proveedor?.ruc || 'No registrado'} />
        </div>
        {recepcion.observaciones && (
          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Observaciones generales</p>
            <p className="mt-1 text-sm text-blue-900">{recepcion.observaciones}</p>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800">Productos recibidos</h2>
          <p className="mt-1 text-sm text-gray-500">Comparación entre lo esperado y lo recibido.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-gray-50">
              <tr>
                <TableHead>Producto</TableHead>
                <TableHead align="center">Esperado</TableHead>
                <TableHead align="center">Recibido</TableHead>
                <TableHead align="center">Diferencia</TableHead>
                <TableHead align="center">Estado</TableHead>
                <TableHead>Observación</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recepcion.detalles.map((detalle) => {
                const diferencia = Number(detalle.cantidadRecibida) - Number(detalle.cantidadEsperada);
                const config = estadoItem[detalle.estado];
                return (
                  <tr key={detalle.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-800">{detalle.descripcion}</p>
                      {detalle.producto?.codigo && <p className="mt-0.5 text-xs text-gray-400">{detalle.producto.codigo}</p>}
                    </td>
                    <TableCell align="center">{detalle.cantidadEsperada}</TableCell>
                    <TableCell align="center">{detalle.cantidadRecibida}</TableCell>
                    <TableCell align="center">
                      <span className={diferencia === 0 ? 'text-gray-500' : diferencia > 0 ? 'font-medium text-blue-600' : 'font-medium text-red-600'}>
                        {diferencia > 0 ? `+${diferencia}` : diferencia}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${config.clase}`}>{config.label}</span>
                    </TableCell>
                    <TableCell>{detalle.observacion || '—'}</TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-gray-800">Guías de remisión</h2>
        {recepcion.guias && recepcion.guias.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {recepcion.guias.map((guia) => (
              <div key={guia.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{guia.numero}</p>
                  <p className="text-xs text-gray-500">
                    {guia.emisor || 'Emisor no registrado'} → {guia.receptor || 'Receptor no registrado'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">Esta recepción no tiene guías de remisión registradas.</p>
        )}
      </section>
    </div>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 font-medium text-gray-700">{icon}{value}</p>
    </div>
  );
}

function TableHead({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' }) {
  return <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${align === 'center' ? 'text-center' : 'text-left'}`}>{children}</th>;
}

function TableCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' }) {
  return <td className={`px-4 py-4 text-sm text-gray-700 ${align === 'center' ? 'text-center' : 'text-left'}`}>{children}</td>;
}
