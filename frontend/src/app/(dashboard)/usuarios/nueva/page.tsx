'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Usuario, usersApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

type UsuarioForm = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: string;
  activo: boolean;
};

const EMPTY_FORM: UsuarioForm = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: 'TRABAJADOR',
  activo: true,
};

const ROLES = [
  { value: 'TRABAJADOR', label: 'Trabajador' },
  { value: 'JEFE_AREA', label: 'Jefe de Área' },
  { value: 'ANALISTA_COMPRAS', label: 'Analista de Compras' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'ENCARGADO_ALMACEN', label: 'Encargado de Almacén' },
  { value: 'CONTADOR', label: 'Contador' },
  { value: 'ADMIN', label: 'Administrador' },
];

export default function NuevoUsuarioPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [form, setForm] = useState<UsuarioForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = user?.rol === 'ADMIN';

  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          No tienes permisos para crear usuarios.
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof UsuarioForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await usersApi.create({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        rol: form.rol,
        activo: form.activo,
      });
      setSuccess('Usuario creado correctamente!');
      setTimeout(() => {
        router.push('/usuarios');
      }, 1000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudo guardar el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/usuarios"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-DEFAULT">Nuevo Usuario</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Crea un nuevo usuario en el sistema
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

      <Card title="Datos del Usuario">
        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
            <input
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
              placeholder="Juan"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input
              value={form.apellido}
              onChange={(e) => handleChange('apellido', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
              placeholder="Pérez"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
              placeholder="juan.perez@empresa.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent placeholder-gray-400 transition-shadow"
              placeholder="********"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={form.rol}
              onChange={(e) => handleChange('rol', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-DEFAULT focus:border-transparent transition-shadow"
              required
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
            />
            Usuario activo
          </label>
          <div className="pt-4 flex gap-3">
            <Link
              href="/usuarios"
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
              {isSaving ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
