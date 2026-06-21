'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Plus, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type ProductoForm = {
  codigo: string;
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  categoria: string;
  precioReferencial: string;
  activo: boolean;
};

const EMPTY_FORM: ProductoForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  unidadMedida: '',
  categoria: '',
  precioReferencial: '',
  activo: true,
};

const ROLES_GESTION = ['ADMIN', 'GERENTE', 'ANALISTA_COMPRAS', 'ENCARGADO_ALMACEN'];

export default function NuevoProductoPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [form, setForm] = useState<ProductoForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = ROLES_GESTION.includes(user?.rol || '');

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
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await api.post('/productos', payload);
      setSuccess('Producto creado correctamente!');
      setTimeout(() => {
        router.push('/productos');
      }, 1000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudo guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-primary-DEFAULT">Nuevo Producto</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Agrega un nuevo producto al catálogo.
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
              <Plus className="w-4 h-4" />
              {isSaving ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
