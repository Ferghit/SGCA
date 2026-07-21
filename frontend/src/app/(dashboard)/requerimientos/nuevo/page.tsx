'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRequerimientosStore } from '@/store/requerimientosStore';
import { Producto, Prioridad, Requerimiento } from '@/types';
import api, { productosApi } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { getDateInputValue, getLocalDateInputValue } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Send,
  FilePenLine,
  PackagePlus,
} from 'lucide-react';
import Link from 'next/link';

interface DetalleForm {
  productoId: number;
  cantidad: number;
  unidadMedida: string;
  observacion: string;
}

type SubmitAction = 'draft' | 'submit';

type NuevoProductoForm = {
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  categoria: string;
  precioReferencial: string;
};

const CATEGORIAS_SUGERIDAS = [
  'Utiles de Oficina',
  'Insumos de Impresion',
  'Equipos de Computo',
  'Limpieza e Higiene',
  'Mobiliario',
  'Otros',
];

const EMPTY_NUEVO_PRODUCTO: NuevoProductoForm = {
  nombre: '',
  descripcion: '',
  unidadMedida: '',
  categoria: '',
  precioReferencial: '',
};

const PRIORIDADES: { value: Prioridad; label: string; desc: string }[] = [
  { value: 'BAJA', label: 'Baja', desc: 'Sin urgencia' },
  { value: 'MEDIA', label: 'Media', desc: 'Normal' },
  { value: 'ALTA', label: 'Alta', desc: 'Importante' },
  { value: 'URGENTE', label: 'Urgente', desc: 'Critico' },
];

export default function NuevoRequerimientoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const editId = Number(searchParams.get('edit'));
  const isEditMode = Number.isFinite(editId) && editId > 0;

  const {
    create,
    update,
    enviarParaAprobacion,
    isLoading,
  } = useRequerimientosStore();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingProductos, setIsLoadingProductos] = useState(true);
  const [isLoadingRequerimiento, setIsLoadingRequerimiento] = useState(isEditMode);
  const [editableRequerimiento, setEditableRequerimiento] = useState<Requerimiento | null>(null);
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA');
  const [fechaRequerida, setFechaRequerida] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [detalles, setDetalles] = useState<DetalleForm[]>([
    { productoId: 0, cantidad: 1, unidadMedida: '', observacion: '' },
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitAction, setSubmitAction] = useState<SubmitAction>('draft');
  const [showNuevoProductoModal, setShowNuevoProductoModal] = useState(false);
  const [detalleIndexForProducto, setDetalleIndexForProducto] = useState(0);
  const [nuevoProducto, setNuevoProducto] = useState<NuevoProductoForm>(EMPTY_NUEVO_PRODUCTO);
  const [nuevoProductoError, setNuevoProductoError] = useState('');
  const [isCreatingProducto, setIsCreatingProducto] = useState(false);

  const latestObservation = useMemo(() => {
    if (!editableRequerimiento) return '';

    const historialObservacion = [...editableRequerimiento.historial]
      .reverse()
      .find((item) => item.estadoNuevo === 'EN_REVISION' && item.comentario?.trim());

    return historialObservacion?.comentario || editableRequerimiento.comentarioJefe || '';
  }, [editableRequerimiento]);

  useEffect(() => {
    if (user && !['TRABAJADOR', 'ADMIN'].includes(user.rol)) {
      router.replace('/requerimientos');
    }
  }, [router, user]);

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

  useEffect(() => {
    const fetchRequerimiento = async () => {
      if (!isEditMode) {
        setIsLoadingRequerimiento(false);
        return;
      }

      try {
        const { data } = await api.get<Requerimiento>(`/requerimientos/${editId}`);
        setEditableRequerimiento(data);
        setPrioridad(data.prioridad);
        setFechaRequerida(getDateInputValue(data.fechaRequerida));
        setDescripcion(data.descripcion || '');
        setDetalles(
          data.detalles.map((detalle) => ({
            productoId: detalle.productoId,
            cantidad: Number(detalle.cantidad),
            unidadMedida: detalle.unidadMedida,
            observacion: detalle.observacion || '',
          })),
        );

        if (!['BORRADOR', 'EN_REVISION'].includes(data.estado)) {
          setError('Este requerimiento ya no se puede editar porque no está en BORRADOR ni EN_REVISION.');
        }
      } catch {
        setError('No se pudo cargar el requerimiento para editar.');
      } finally {
        setIsLoadingRequerimiento(false);
      }
    };

    fetchRequerimiento();
  }, [editId, isEditMode]);

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
    } else if (field === 'cantidad') {
      updated[index] = { ...updated[index], cantidad: Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setDetalles(updated);
  };

  const openNuevoProductoModal = (index: number) => {
    setDetalleIndexForProducto(index);
    setNuevoProducto({
      ...EMPTY_NUEVO_PRODUCTO,
      unidadMedida: detalles[index]?.unidadMedida || '',
    });
    setNuevoProductoError('');
    setShowNuevoProductoModal(true);
  };

  const handleCreateProducto = async () => {
    setNuevoProductoError('');

    if (!nuevoProducto.nombre.trim() || !nuevoProducto.unidadMedida.trim() || !nuevoProducto.categoria.trim()) {
      setNuevoProductoError('Completa nombre, categoría y unidad de medida.');
      return;
    }

    setIsCreatingProducto(true);
    try {
      const created = await productosApi.createFromRequerimiento({
        nombre: nuevoProducto.nombre.trim(),
        descripcion: nuevoProducto.descripcion.trim() || undefined,
        unidadMedida: nuevoProducto.unidadMedida.trim(),
        categoria: nuevoProducto.categoria.trim(),
        precioReferencial: nuevoProducto.precioReferencial
          ? Number(nuevoProducto.precioReferencial)
          : undefined,
      });

      setProductos((prev) =>
        [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      );

      setDetalles((prev) => {
        const updated = [...prev];
        updated[detalleIndexForProducto] = {
          ...updated[detalleIndexForProducto],
          productoId: created.id,
          unidadMedida: created.unidadMedida,
        };
        return updated;
      });
      setShowNuevoProductoModal(false);
      setNuevoProducto(EMPTY_NUEVO_PRODUCTO);
      setSuccess(`Producto "${created.nombre}" registrado en el catálogo. El administrador fue notificado.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setNuevoProductoError(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo registrar el producto.');
    } finally {
      setIsCreatingProducto(false);
    }
  };

  const buildPayload = () => ({
    prioridad,
    fechaRequerida,
    descripcion: descripcion.trim() || undefined,
    detalles: detalles.map((d) => ({
      productoId: d.productoId,
      cantidad: Number(d.cantidad),
      unidadMedida: d.unidadMedida,
      observacion: d.observacion.trim() || undefined,
    })),
  });

  const handleSubmit = async (action: SubmitAction) => {
    setSubmitAction(action);
    setError('');
    setSuccess('');

    if (!fechaRequerida) {
      setError('La fecha requerida es obligatoria.');
      return;
    }

    if (productos.length === 0 && detalles.some((d) => !d.productoId)) {
      setError('Agrega al menos un producto al requerimiento o registra uno nuevo en el catálogo.');
      return;
    }

    if (detalles.some((d) => !d.productoId || !d.unidadMedida || d.cantidad <= 0)) {
      setError('Completa todos los campos de los productos (producto, cantidad y unidad de medida).');
      return;
    }

    if (isEditMode && editableRequerimiento && !['BORRADOR', 'EN_REVISION'].includes(editableRequerimiento.estado)) {
      setError('Este requerimiento ya no se puede editar.');
      return;
    }

    try {
      const payload = buildPayload();
      const result = isEditMode && editableRequerimiento
        ? await update(editableRequerimiento.id, payload)
        : await create(payload);

      if (action === 'submit') {
        await enviarParaAprobacion(result.id);
      }

      const actionLabel =
        action === 'submit'
          ? isEditMode
            ? 'actualizado y enviado a aprobación'
            : 'creado y enviado a aprobación'
          : isEditMode
            ? 'actualizado exitosamente'
            : 'creado exitosamente';

      setSuccess(`Requerimiento ${result.codigo} ${actionLabel}.`);
      setTimeout(() => router.push(`/requerimientos/${result.id}`), 1200);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al guardar el requerimiento.');
    }
  };

  if (isLoadingRequerimiento) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#006D77', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const disableForm =
    isLoading ||
    isLoadingProductos ||
    (isEditMode && !!editableRequerimiento && !['BORRADOR', 'EN_REVISION'].includes(editableRequerimiento.estado));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/requerimientos" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="page-title">
            {isEditMode ? 'Editar Requerimiento' : 'Nuevo Requerimiento'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditMode
              ? 'Actualiza el contenido antes de guardarlo o reenviarlo'
              : 'Solicita materiales o equipos para tu area'}
          </p>
        </div>
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

      {isEditMode && editableRequerimiento?.estado === 'EN_REVISION' && latestObservation && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <FilePenLine className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Observaciones pendientes</p>
            <p className="text-sm text-amber-700 mt-1">{latestObservation}</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
          <h2 className="section-title">Informacion General</h2>

          <div>
            <label className="label-field">
              Prioridad del Requerimiento <span className="text-red-500">*</span>
            </label>
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
                  style={
                    prioridad === p.value
                      ? { borderColor: '#006D77', backgroundColor: '#E0F2F3' }
                      : {}
                  }
                >
                  <p className="font-semibold text-sm text-primary-DEFAULT">{p.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">
              Fecha Requerida <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fechaRequerida}
              min={getLocalDateInputValue()}
              onChange={(e) => setFechaRequerida(e.target.value)}
              className="input-field max-w-xs"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Fecha en que necesitas los materiales</p>
          </div>

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
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
              El catálogo está vacío. Usa &quot;Registrar nuevo producto&quot; en la fila del detalle para agregar el primer ítem.
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
                    <label className="label-field">
                      Producto <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={det.productoId || ''}
                        onChange={(e) => updateDetalle(index, 'productoId', e.target.value)}
                        className="input-field flex-1"
                        required
                      >
                        <option value="">-- Selecciona un producto --</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.codigo}] {p.nombre} ({p.categoria})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => openNuevoProductoModal(index)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors shrink-0"
                        style={{ color: '#006D77', borderColor: '#006D77' }}
                      >
                        <PackagePlus className="w-4 h-4" />
                        Registrar nuevo
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Si el producto no está en el catálogo, regístralo aquí. Se notificará al administrador.
                    </p>
                  </div>

                  <div>
                    <label className="label-field">
                      Cantidad <span className="text-red-500">*</span>
                    </label>
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
                    <label className="label-field">
                      Unidad de Medida <span className="text-red-500">*</span>
                    </label>
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

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href="/requerimientos" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={disableForm}
            className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && submitAction === 'draft'
              ? isEditMode
                ? 'Guardando cambios...'
                : 'Guardando...'
              : isEditMode
                ? 'Guardar cambios'
                : 'Guardar como Borrador'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('submit')}
            disabled={disableForm}
            className="px-6 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: '#006D77' }}
          >
            <Send className="w-4 h-4" />
            {isLoading && submitAction === 'submit'
              ? 'Procesando...'
              : 'Guardar y enviar a aprobacion'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showNuevoProductoModal}
        onClose={() => !isCreatingProducto && setShowNuevoProductoModal(false)}
        title="Registrar nuevo producto"
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNuevoProductoModal(false)}
              disabled={isCreatingProducto}
              className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateProducto}
              disabled={isCreatingProducto}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#006D77' }}
            >
              {isCreatingProducto ? 'Registrando...' : 'Agregar al catálogo'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {nuevoProductoError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {nuevoProductoError}
            </div>
          )}

          <p className="text-sm text-gray-600">
            El producto se agregará al catálogo y quedará seleccionado en este requerimiento.
            El administrador recibirá una notificación con tu usuario y la fecha del registro.
          </p>

          <div>
            <label className="label-field">
              Nombre del producto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto((prev) => ({ ...prev, nombre: e.target.value }))}
              className="input-field"
              placeholder="Ej: Marcador permanente negro"
              maxLength={150}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">
                Categoría <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="categorias-producto"
                value={nuevoProducto.categoria}
                onChange={(e) => setNuevoProducto((prev) => ({ ...prev, categoria: e.target.value }))}
                className="input-field"
                placeholder="Utiles de Oficina"
                maxLength={100}
              />
              <datalist id="categorias-producto">
                {CATEGORIAS_SUGERIDAS.map((categoria) => (
                  <option key={categoria} value={categoria} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label-field">
                Unidad de medida <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nuevoProducto.unidadMedida}
                onChange={(e) => setNuevoProducto((prev) => ({ ...prev, unidadMedida: e.target.value }))}
                className="input-field"
                placeholder="Unidad, Caja, Resma..."
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <label className="label-field">Precio referencial (opcional)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={nuevoProducto.precioReferencial}
              onChange={(e) => setNuevoProducto((prev) => ({ ...prev, precioReferencial: e.target.value }))}
              className="input-field"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="label-field">Descripción (opcional)</label>
            <textarea
              value={nuevoProducto.descripcion}
              onChange={(e) => setNuevoProducto((prev) => ({ ...prev, descripcion: e.target.value }))}
              className="input-field resize-none"
              rows={3}
              placeholder="Detalles adicionales del producto..."
              maxLength={500}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
