'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAlmacenStore } from '@/store/almacenStore';
import { Card } from '@/components/ui/Card';
import { OrdenCompra, EstadoItemRecepcion } from '@/types';

interface ItemForm {
  ordenCompraDetalleId: number;
  descripcion: string;
  cantidadEsperada: number;
  cantidadRecibida: number;
  estado: EstadoItemRecepcion;
  observacion: string;
}

export default function RecepcionFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { registrarRecepcion } = useAlmacenStore();

  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [alertas, setAlertas] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get(`/almacen/ordenes/${id}`).then(({ data }) => {
      setOrden(data);
      setItems(
        data.detalles.map((d: any) => ({
          ordenCompraDetalleId: d.id,
          descripcion: d.descripcion,
          cantidadEsperada: Number(d.cantidad),
          cantidadRecibida: Number(d.cantidad),
          estado: 'CONFORME' as EstadoItemRecepcion,
          observacion: '',
        })),
      );
    });
  }, [id]);

  const actualizarItem = (idx: number, campo: keyof ItemForm, valor: any) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  };

  const enviar = async () => {
    setEnviando(true);
    try {
      const resultado = await registrarRecepcion({
        ordenCompraId: Number(id),
        observaciones,
        items: items.map(({ ordenCompraDetalleId, cantidadRecibida, estado, observacion }) => ({
          ordenCompraDetalleId,
          cantidadRecibida,
          estado,
          observacion,
        })),
      });
      setAlertas(resultado.alertas);
      if (resultado.alertas.length === 0) router.push('/recepciones');
    } finally {
      setEnviando(false);
    }
  };

  if (!orden) return <p className="text-sm text-gray-400">Cargando orden...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-DEFAULT">Recepción — OC {orden.numero}</h1>
      <p className="text-sm text-gray-500">Proveedor: {orden.proveedor.razonSocial}</p>

      <Card title="Detalle de productos">
        <div className="space-y-4">
          {items.map((it, idx) => (
            <div
              key={it.ordenCompraDetalleId}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center border-b border-gray-100 pb-3"
            >
              <p className="md:col-span-2 text-sm font-medium">
                {it.descripcion} <span className="text-gray-400">(pedido: {it.cantidadEsperada})</span>
              </p>
              <input
                type="number"
                className="border rounded-lg px-2 py-1.5 text-sm"
                value={it.cantidadRecibida}
                onChange={(e) => actualizarItem(idx, 'cantidadRecibida', Number(e.target.value))}
              />
              <select
                className="border rounded-lg px-2 py-1.5 text-sm"
                value={it.estado}
                onChange={(e) => actualizarItem(idx, 'estado', e.target.value as EstadoItemRecepcion)}
              >
                <option value="CONFORME">Conforme</option>
                <option value="DANADO">Dañado</option>
                <option value="FALTANTE">Faltante</option>
              </select>
              <input
                type="text"
                placeholder="Observación"
                className="border rounded-lg px-2 py-1.5 text-sm"
                value={it.observacion}
                onChange={(e) => actualizarItem(idx, 'observacion', e.target.value)}
              />
            </div>
          ))}
        </div>

        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm mt-4"
          placeholder="Observaciones generales de la recepción"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        {alertas.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-amber-700 mb-1">Diferencias detectadas:</p>
            {alertas.map((a, i) => (
              <p key={i} className="text-xs text-amber-700">• {a}</p>
            ))}
          </div>
        )}

        <button
          onClick={enviar}
          disabled={enviando}
          className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#006D77' }}
        >
          {enviando ? 'Registrando...' : 'Registrar recepción'}
        </button>
      </Card>
    </div>
  );
}
