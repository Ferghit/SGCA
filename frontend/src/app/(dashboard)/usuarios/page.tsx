'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, StatCard } from '@/components/ui/Card';
import { Usuario, usersApi } from '@/lib/api';
import { AlertCircle, Users, Plus, Power, Search, FileText } from 'lucide-react';
import Link from 'next/link';

export default function UsuariosPage() {
  const user = useAuthStore((s) => s.user);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = user?.rol === 'ADMIN';

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usuarios;
    return usuarios.filter((usuario) =>
      [usuario.nombre, usuario.apellido, usuario.email, usuario.rol]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [usuarios, search]);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await usersApi.getAll();
      setUsuarios(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const toggleActivo = async (usuario: Usuario) => {
    if (!canManage) return;

    setError('');
    setSuccess('');
    try {
      await usersApi.toggleActivo(usuario.id);
      setSuccess(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente.`);
      await fetchUsuarios();
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudo actualizar el estado del usuario.');
    }
  };

  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          No tienes permisos para administrar usuarios.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-DEFAULT">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona los usuarios del sistema y sus roles.
          </p>
        </div>
        <Link
          href="/usuarios/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors"
          style={{ backgroundColor: '#006D77' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Link>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total usuarios" value={usuarios.length} icon={Users} color="secondary" />
        <StatCard
          label="Activos"
          value={usuarios.filter((u) => u.activo).length}
          icon={Users}
          color="green"
        />
        <StatCard
          label="Inactivos"
          value={usuarios.filter((u) => !u.activo).length}
          icon={Users}
          color="amber"
        />
      </div>

      <Card title="Lista de usuarios">
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Buscar por nombre, apellido o email"
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Cargando usuarios...</p>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay usuarios registrados</p>
              <Link href="/usuarios/nueva" className="mt-3 inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#006D77' }}>
                <Plus className="w-4 h-4" /> Crear el primero
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Nombres</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Apellidos</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Email</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Rol</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Estado</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold text-right whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2 sm:px-4">
                        <p className="font-medium text-primary-DEFAULT">{usuario.nombre}</p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <p className="font-medium text-gray-700">{usuario.apellido}</p>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-gray-600">{usuario.email}</td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-secondary-DEFAULT bg-opacity-10 text-secondary-DEFAULT">
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            usuario.activo
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => toggleActivo(usuario)}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50"
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
