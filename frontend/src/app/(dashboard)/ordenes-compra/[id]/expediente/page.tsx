'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Package,
  Store,
} from 'lucide-react';
import { EstadoOCBadge } from '@/components/ui/Badge';
import { ordenesCompraApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type {
  OfertaProveedor,
  OrdenCompra,
  Proveedor,
  Requerimiento,
  SolicitudCotizacion,
} from '@/types';

interface ExpedienteData {
  orden: OrdenCompra;
  expediente: {
    requerimiento: Requerimiento;
    solicitudCotizacion: SolicitudCotizacion;
    ofertas: OfertaProveedor[];
    proveedorSeleccionado: Proveedor;
  };
}

export default function ExpedienteOrdenCompraPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ExpedienteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarExpediente = async () => {
      try {
        setIsLoading(true);
        setError('');
        const resultado = await ordenesCompraApi.getExpediente(Number(id));
        setData(resultado as ExpedienteData);
      } catch (err: any) {
        setError(
          err.response?.status === 403
            ? 'No tienes permisos para consultar este expediente.'
            : err.response?.data?.message || 'No se pudo cargar el expediente digital.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) cargarExpediente();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: '#006D77', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-red-400" />
        <p className="font-medium text-red-800">{error || 'Expediente no encontrado.'}</p>
        <button
          onClick={() => router.push(`/ordenes-compra/${id}`)}
          className="mt-5 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#006D77' }}
        >
          Volver a la orden
        </button>
      </div>
    );
  }

  const { orden, expediente } = data;
  const { requerimiento, solicitudCotizacion, ofertas, proveedorSeleccionado } = expediente;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => router.push(`/ordenes-compra/${orden.id}`)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          aria-label="Volver a la orden de compra"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="page-title">Expediente digital</h1>
          <p className="text-sm text-gray-500">
            Trazabilidad completa de la orden {orden.numero}
          </p>
        </div>
        <EstadoOCBadge estado={orden.estado} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<FileText className="h-5 w-5" />}
          label="Orden de compra"
          value={orden.numero}
          detail={formatDate(orden.fechaEmision)}
        />
        <SummaryCard
          icon={<Store className="h-5 w-5" />}
          label="Proveedor adjudicado"
          value={proveedorSeleccionado.razonSocial}
          detail={`RUC ${proveedorSeleccionado.ruc}`}
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Monto total"
          value={formatCurrency(orden.montoTotal)}
          detail={`Incluye IGV: ${formatCurrency(orden.igv)}`}
        />
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-card">
        <SectionTitle icon={<ClipboardList className="h-5 w-5" />} title="1. Requerimiento" />
        <div className="mb-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
          <Info label="Código" value={requerimiento.codigo} />
          <Info label="Estado" value={requerimiento.estado.replaceAll('_', ' ')} />
          <Info label="Prioridad" value={requerimiento.prioridad} />
          <Info label="Fecha requerida" value={formatDate(requerimiento.fechaRequerida)} />
        </div>
        {requerimiento.descripcion && (
          <p className="mb-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            {requerimiento.descripcion}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead className="bg-gray-50">
              <tr>
                <TableHead>Producto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead align="center">Cantidad solicitada</TableHead>
                <TableHead>Unidad</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requerimiento.detalles.map((detalle) => (
                <tr key={detalle.id}>
                  <TableCell>{detalle.producto?.nombre || 'Producto'}</TableCell>
                  <TableCell>{detalle.producto?.codigo || '—'}</TableCell>
                  <TableCell align="center">{detalle.cantidad}</TableCell>
                  <TableCell>{detalle.unidadMedida}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-card">
        <SectionTitle icon={<Calendar className="h-5 w-5" />} title="2. Solicitud de cotización" />
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
          <Info label="Código" value={solicitudCotizacion.codigo} />
          <Info label="Título" value={solicitudCotizacion.titulo} />
          <Info label="Estado" value={solicitudCotizacion.estado} />
          <Info label="Fecha límite" value={formatDate(solicitudCotizacion.fechaLimite)} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-card">
        <SectionTitle icon={<Store className="h-5 w-5" />} title="3. Ofertas recibidas" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50">
              <tr>
                <TableHead>Proveedor</TableHead>
                <TableHead align="right">Monto</TableHead>
                <TableHead align="center">Plazo</TableHead>
                <TableHead>Condiciones</TableHead>
                <TableHead align="center">Resultado</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ofertas.map((oferta) => (
                <tr key={oferta.id} className={oferta.estado === 'SELECCIONADA' ? 'bg-emerald-50/60' : ''}>
                  <TableCell>
                    <p className="font-medium text-gray-800">{oferta.proveedor.razonSocial}</p>
                    <p className="text-xs text-gray-400">RUC {oferta.proveedor.ruc}</p>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(oferta.montoTotal)}</TableCell>
                  <TableCell align="center">{oferta.plazoEntregaDias} día(s)</TableCell>
                  <TableCell>{oferta.condicionesPago || 'Sin condiciones registradas'}</TableCell>
                  <TableCell align="center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        oferta.estado === 'SELECCIONADA'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {oferta.estado}
                    </span>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-card">
        <SectionTitle icon={<Package className="h-5 w-5" />} title="4. Orden de compra generada" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="bg-gray-50">
              <tr>
                <TableHead>Descripción</TableHead>
                <TableHead align="center">Cantidad</TableHead>
                <TableHead align="right">Precio unitario</TableHead>
                <TableHead align="right">Subtotal</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orden.detalles.map((detalle) => (
                <tr key={detalle.id}>
                  <TableCell>{detalle.descripcion}</TableCell>
                  <TableCell align="center">{detalle.cantidad}</TableCell>
                  <TableCell align="right">{formatCurrency(detalle.precioUnitario)}</TableCell>
                  <TableCell align="right">{formatCurrency(detalle.subtotal)}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 ml-auto w-full max-w-sm space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          <TotalRow label="Subtotal" value={formatCurrency(orden.subtotal)} />
          <TotalRow label="IGV (18%)" value={formatCurrency(orden.igv)} />
          <TotalRow label="Total" value={formatCurrency(orden.montoTotal)} strong />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 truncate font-semibold text-gray-800" title={value}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2 text-gray-800">
      <span className="text-teal-700">{icon}</span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-medium text-gray-700">{value}</p>
    </div>
  );
}

function TableHead({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
  const alignment = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];
  return <th className={`px-4 py-3 ${alignment} text-xs font-semibold uppercase tracking-wide text-gray-500`}>{children}</th>;
}

function TableCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
  const alignment = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];
  return <td className={`px-4 py-3 ${alignment} text-sm text-gray-700`}>{children}</td>;
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'border-t border-gray-200 pt-2 text-base font-bold text-gray-900' : 'text-gray-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
