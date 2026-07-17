'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, PackageCheck } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { useAlmacenStore } from '@/store/almacenStore';
import type { EstadoItemRecepcion, OrdenCompra } from '@/types';

interface ItemForm {
  ordenCompraDetalleId: number;
  descripcion: string;
  cantidadPedida: number;
  cantidadRecibidaAnterior: number;
  cantidadPendiente: number;
  cantidadRecibida: number;
  estado: EstadoItemRecepcion;
  observacion: string;
  motivoDevolucion: string;
}

const formatoCantidad = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

export default function RecepcionFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { registrarRecepcion } = useAlmacenStore();

  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarOrden = async () => {
      try {
        setIsLoading(true);
        setError('');
        const { data } = await api.get<OrdenCompra>(`/almacen/ordenes/${id}`);
        setOrden(data);
        setItems(
          data.detalles
            .map((detalle) => {
              const cantidadPedida = Number(detalle.cantidad);
              const cantidadRecibidaAnterior = Number(detalle.cantidadRecibidaAcumulada || 0);
              const cantidadPendiente = Math.max(
                0,
                Number(detalle.cantidadPendiente ?? cantidadPedida - cantidadRecibidaAnterior),
              );
              return {
                ordenCompraDetalleId: detalle.id,
                descripcion: detalle.descripcion,
                cantidadPedida,
                cantidadRecibidaAnterior,
                cantidadPendiente,
                cantidadRecibida: cantidadPendiente,
                estado: 'CONFORME' as EstadoItemRecepcion,
                observacion: '',
                motivoDevolucion: '',
              };
            })
            .filter((detalle) => detalle.cantidadPendiente > 0),
        );
      } catch (requestError: any) {
        setError(requestError.response?.data?.message || 'No se pudo cargar la orden de compra.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) cargarOrden();
  }, [id]);

  const actualizarItem = <K extends keyof ItemForm>(indice: number, campo: K, valor: ItemForm[K]) => {
    setItems((actuales) => actuales.map((item, itemIndice) => (
      itemIndice === indice ? { ...item, [campo]: valor } : item
    )));
  };

  const cambiarEstado = (indice: number, estado: EstadoItemRecepcion) => {
    setItems((actuales) => actuales.map((item, itemIndice) => {
      if (itemIndice !== indice) return item;
      return {
        ...item,
        estado,
        cantidadRecibida: estado === 'FALTANTE' ? 0 : item.cantidadRecibida,
      };
    }));
  };

  const erroresFormulario = useMemo(() => {
    const errores: string[] = [];
    for (const item of items) {
      if (!Number.isFinite(item.cantidadRecibida) || item.cantidadRecibida < 0) {
        errores.push(`${item.descripcion}: ingrese una cantidad válida.`);
      } else if (item.cantidadRecibida > item.cantidadPendiente) {
        errores.push(`${item.descripcion}: no puede superar el pendiente (${formatoCantidad.format(item.cantidadPendiente)}).`);
      } else if (item.estado === 'CONFORME' && item.cantidadRecibida <= 0) {
        errores.push(`${item.descripcion}: la cantidad conforme debe ser mayor a cero.`);
      } else if (item.estado === 'FALTANTE' && item.cantidadRecibida !== 0) {
        errores.push(`${item.descripcion}: un faltante debe registrarse con cantidad cero.`);
      } else if (item.estado === 'DANADO' && !item.observacion.trim()) {
        errores.push(`${item.descripcion}: describa el daño observado.`);
      } else if (item.estado === 'DANADO' && item.cantidadRecibida <= 0) {
        errores.push(`${item.descripcion}: indique la cantidad dañada.`);
      }
      if (item.estado === 'DANADO' && !item.motivoDevolucion.trim()) {
        errores.push('Indique el motivo de devolución para el producto dañado.');
      }
    }
    if (items.length > 0 && !items.some((item) => item.cantidadRecibida > 0)) {
      errores.push('Registre al menos una unidad recibida o dañada.');
    }
    return errores;
  }, [items]);

  const enviar = async () => {
    if (erroresFormulario.length > 0) {
      setError(erroresFormulario[0]);
      return;
    }

    setEnviando(true);
    setError('');
    try {
      const resultado = await registrarRecepcion({
        ordenCompraId: Number(id),
        observaciones,
        items: items.map(({ ordenCompraDetalleId, cantidadRecibida, estado, observacion, motivoDevolucion }) => ({
          ordenCompraDetalleId,
          cantidadRecibida,
          estado,
          observacion: observacion.trim() || undefined,
          motivoDevolucion: motivoDevolucion.trim() || undefined,
        })),
      });
      router.replace(`/recepciones/registradas/${resultado.recepcion.id}`);
    } catch (requestError: any) {
      setError(requestError.message || 'No se pudo registrar la recepción.');
    } finally {
      setEnviando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (error && !orden) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  }

  if (!orden) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-DEFAULT">Recepción - OC {orden.numero}</h1>
          <p className="mt-1 text-sm text-gray-500">Proveedor: {orden.proveedor.razonSocial}</p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
          {items.length} ítem(s) pendiente(s)
        </span>
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
            <p className="font-medium text-gray-800">Esta orden no tiene cantidades pendientes por recibir.</p>
            <button onClick={() => router.push('/recepciones')} className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
              Volver a recepciones
            </button>
          </div>
        </Card>
      ) : (
        <Card title="Detalle de productos" subtitle="Cantidades pendientes de la orden de compra">
          <div className="space-y-4">
            {items.map((item, indice) => (
              <div key={item.ordenCompraDetalleId} className="rounded-lg border border-gray-100 p-4">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <p className="text-sm font-semibold text-gray-800">{item.descripcion}</p>
                  <div className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>Pedido: <strong className="text-gray-700">{formatoCantidad.format(item.cantidadPedida)}</strong></span>
                    <span>Recibido: <strong className="text-gray-700">{formatoCantidad.format(item.cantidadRecibidaAnterior)}</strong></span>
                    <span className="font-medium text-teal-700">Pendiente: {formatoCantidad.format(item.cantidadPendiente)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">{item.estado === "DANADO" ? "Cantidad dañada / devolver" : "Cantidad recibida"}</span>
                    <input
                      type="number"
                      min="0"
                      max={item.cantidadPendiente}
                      step="0.01"
                      disabled={item.estado === 'FALTANTE'}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                      value={item.cantidadRecibida}
                      onChange={(event) => actualizarItem(indice, 'cantidadRecibida', Number(event.target.value))}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Resultado</span>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      value={item.estado}
                      onChange={(event) => cambiarEstado(indice, event.target.value as EstadoItemRecepcion)}
                    >
                      <option value="CONFORME">Conforme</option>
                      <option value="DANADO">Dañado</option>
                      <option value="FALTANTE">Faltante</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">
                      {item.estado === 'DANADO' ? 'Descripción del daño' : 'Observación'}
                    </span>
                    <input
                      type="text"
                      placeholder={item.estado === 'DANADO' ? 'Obligatorio para producto dañado' : 'Opcional'}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      value={item.observacion}
                      onChange={(event) => actualizarItem(indice, 'observacion', event.target.value)}
                    />
                  </label>
                  {item.estado === "DANADO" && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">Motivo de devolución</span>
                      <input
                        type="text"
                        placeholder="Obligatorio para devolver"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        value={item.motivoDevolucion}
                        onChange={(event) => actualizarItem(indice, "motivoDevolucion", event.target.value)}
                      />
                    </label>
                  )}
                </div>

                {item.estado === 'DANADO' && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>La cantidad dañada quedará registrada, pero no ingresará al inventario.</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Observaciones generales</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Observaciones generales de la recepción"
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
            />
          </label>

          {erroresFormulario.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{erroresFormulario[0]}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">Los productos conformes actualizan el inventario.</p>
            <button
              onClick={enviar}
              disabled={enviando || erroresFormulario.length > 0}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PackageCheck className="h-4 w-4" />
              {enviando ? 'Registrando...' : 'Registrar recepción'}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}