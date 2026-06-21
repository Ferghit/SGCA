'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Producto } from '@/types';

type ProductoForm = {
  codigo: string;
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  categoria: string;
  precioReferencial: string;
  activo: boolean;
};

const ROLES_GESTION = ['ADMIN', 'GERENTE', 'ANALISTA_COMPRAS', 'ENCARGADO_ALMACEN'];

export default function EditarProductoPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [form, setForm] = useState<ProductoForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = ROLES_GESTION.includes(user?.rol || '');

  useEffect(() => {
    const fetchProducto = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get<Producto>(`/productos/${id}`);
        setForm({
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          unidadMedida: data.unidadMedida,
          categoria: data.categoria,
          precioReferencial:
            data.precioReferencial !== undefined && data.precioReferencial !== null
              ? String(data.precioReferencial)
              : '',
          activo: data.activo ?? true,
        });
      } catch (e: any) {
        setError(e.response?.data?.message || 'No se pudo cargar el producto.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProducto();
    }
  }, [id]);

  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          No tienes permisos para administrar el catalogo de productos.
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof ProductoForm, value: string | boolean) => {
    setForm((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      unidadMedida: form.unidadMedida,
      categoria: form.categoria,
      precioReferencial: form.precioReferencial ? Number(form.precioReferencial) : undefined,
      activo: form.activo,
    };

    try {
      await api.put(`/productos/${id}`, payload);
      setSuccess('Producto actualizado correctamente!');
      setTimeout(() => {
        router.push('/productos');
      }, 1000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudo guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-secondary-DEFAULT border-t-transparent rounded-full animate-spin" style={{ borderColor: '#006D77', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
          No se encontró el producto.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/productos"
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-DEFAULT">Editar Producto</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Modifica los datos del producto.
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
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          {success}
        </div>
      )}

      <Card title="Datos del Producto">
        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
            <input
              value={form.codigo}
              onChange={(e) => handleChange('codigo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
              placeholder="PRD-011"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
              placeholder="Nombre del producto"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input
                value={form.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
                placeholder="Utiles de Oficina"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
              <input
                value={form.unidadMedida}
                onChange={(e) => handleChange('unidadMedida', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
                placeholder="Unidad, Caja, Resma..."
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio referencial</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.precioReferencial}
              onChange={(e) => handleChange('precioReferencial', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow resize-none"
              rows={3}
              placeholder="Detalles adicionales del producto"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
            />
            Producto activo
          </label>
          <div className="pt-4 flex gap-3">
            <Link
              href="/productos"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-700 font-medium text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-60"
              style={{ backgroundColor: '#006D77' }}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Actualizar Producto'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
