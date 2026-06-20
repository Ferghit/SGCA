'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequerimientosStore } from '@/store/requerimientosStore';
import { Producto, Prioridad } from '@/types';
import api from '@/lib/api';
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface DetalleForm {
  productoId: number;
  cantidad: number;
  unidadMedida: string;
  observacion: string;
}

const PRIORIDADES: { value: Prioridad; label: string; desc: string }[] = [
  { value: 'BAJA', label: 'Baja', desc: 'Sin urgencia' },
  { value: 'MEDIA', label: 'Media', desc: 'Normal' },
  { value: 'ALTA', label: 'Alta', desc: 'Importante' },
  { value: 'URGENTE', label: 'Urgente', desc: 'Critico' },
];

export default function NuevoRequerimientoPage() {
  const router = useRouter();
  const { create, isLoading } = useRequerimientosStore();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingProductos, setIsLoadingProductos] = useState(true);
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA');
  const [fechaRequerida, setFechaRequerida] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [detalles, setDetalles] = useState<DetalleForm[]>([
    { productoId: 0, cantidad: 1, unidadMedida: '', observacion: '' },
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const { data } = await api.get<Producto[]>('/productos?soloActivos=true');
        setProductos(data);
      } catch {
        setError('No se pudo cargar el catalogo de productos. Intenta nuevamente.');
      } finally {
        setIsLoadingProductos(false);
      }
    };
    fetchProductos();
  }, []);

  const addDetalle = () => {
    setDetalles([...detalles, { productoId: 0, cantidad: 1, unidadMedida: '', observacion: '' }]);
  };

  const removeDetalle = (index: number) => {
    if (detalles.length === 1) return;
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const updateDetalle = (index: number, field: keyof DetalleForm, value: string | number) => {
    const updated = [...detalles];
    if (field === 'productoId') {
      const prod = productos.find((p) => p.id === Number(value));
      updated[index] = {
        ...updated[index],
        productoId: Number(value),
        unidadMedida: prod?.unidadMedida || updated[index].unidadMedida,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setDetalles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fechaRequerida) return setError('La fecha requerida es obligatoria.');
    if (productos.length === 0) {
      return setError('No hay productos activos disponibles para generar el requerimiento.');
    }
    if (detalles.some((d) => !d.productoId || !d.unidadMedida || d.cantidad <= 0)) {
      return setError('Completa todos los campos de los productos (producto, cantidad y unidad de medida).');
    }

    try {
      const result = await create({
        prioridad,
        fechaRequerida,
        descripcion: descripcion.trim() || undefined,
        detalles: detalles.map((d) => ({
          productoId: d.productoId,
          cantidad: Number(d.cantidad),
          unidadMedida: d.unidadMedida,
          observacion: d.observacion || undefined,
        })),
      });

      setSuccess(`Requerimiento ${(result as {codigo: string}).codigo} creado exitosamente.`);
      setTimeout(() => router.push('/requerimientos'), 1500);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al crear el requerimiento.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/requerimientos" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="page-title">Nuevo Requerimiento</h1>
          <p className="text-sm text-gray-500 mt-0.5">Solicita materiales o equipos para tu area</p>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Informacion general */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
          <h2 className="section-title">Informacion General</h2>

          {/* Prioridad */}
          <div>
            <label className="label-field">Prioridad del Requerimiento <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
              {PRIORIDADES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPrioridad(p.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    prioridad === p.value
                      ? 'border-secondary-DEFAULT bg-secondary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={prioridad === p.value ? { borderColor: '#006D77', backgroundColor: '#E0F2F3' } : {}}
                >
                  <p className="font-semibold text-sm text-primary-DEFAULT">{p.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha requerida */}
          <div>
            <label className="label-field">Fecha Requerida <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={fechaRequerida}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFechaRequerida(e.target.value)}
              className="input-field max-w-xs"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Fecha en que necesitas los materiales</p>
          </div>

          {/* Descripcion */}
          <div>
            <label className="label-field">Descripcion / Justificacion</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Explica brevemente el motivo de este requerimiento..."
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">{descripcion.length}/500 caracteres</p>
          </div>
        </div>

        {/* Productos solicitados */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Productos Solicitados</h2>
            <button
              type="button"
              onClick={addDetalle}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={{ color: '#006D77', borderColor: '#006D77' }}
            >
              <Plus className="w-4 h-4" />
              Agregar producto
            </button>
          </div>

          {isLoadingProductos ? (
            <p className="text-sm text-gray-500">Cargando catalogo de productos...</p>
          ) : productos.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              No hay productos activos registrados. Solicita a un administrador que cree el catalogo.
            </div>
          ) : null}

          <div className="space-y-3">
            {detalles.map((det, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Producto #{index + 1}
                  </span>
                  {detalles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDetalle(index)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="label-field">Producto <span className="text-red-500">*</span></label>
                    <select
                      value={det.productoId || ''}
                      onChange={(e) => updateDetalle(index, 'productoId', e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- Selecciona un producto --</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.codigo}] {p.nombre} ({p.categoria})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label-field">Cantidad <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={det.cantidad}
                      onChange={(e) => updateDetalle(index, 'cantidad', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="label-field">Unidad de Medida <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={det.unidadMedida}
                      onChange={(e) => updateDetalle(index, 'unidadMedida', e.target.value)}
                      className="input-field"
                      placeholder="Ej: Unidad, Resma, Caja"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label-field">Observacion (opcional)</label>
                    <input
                      type="text"
                      value={det.observacion}
                      onChange={(e) => updateDetalle(index, 'observacion', e.target.value)}
                      className="input-field"
                      placeholder="Especificaciones adicionales..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href="/requerimientos" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading || isLoadingProductos || productos.length === 0}
            className="px-6 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: isLoading ? '#ccc' : '#006D77' }}
          >
            {isLoading ? 'Guardando...' : 'Guardar como Borrador'}
          </button>
        </div>
      </form>
    </div>
  );
}
