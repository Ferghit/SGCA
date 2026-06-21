'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, StatCard } from '@/components/ui/Card';
import { Producto } from '@/types';
import api from '@/lib/api';
import {
  AlertCircle,
  Package,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

const ROLES_GESTION = ['ADMIN', 'GERENTE', 'ANALISTA_COMPRAS', 'ENCARGADO_ALMACEN'];

export default function ProductosPage() {
  const user = useAuthStore((s) => s.user);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = ROLES_GESTION.includes(user?.rol || '');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter((producto) =>
      [producto.codigo, producto.nombre, producto.categoria, producto.unidadMedida]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [productos, search]);

  const fetchProductos = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get<Producto[]>('/productos');
      setProductos(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudo cargar el catalogo de productos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const toggleActivo = async (producto: Producto) => {
    if (!canManage) return;

    setError('');
    setSuccess('');
    try {
      await api.put(`/productos/${producto.id}`, { activo: !(producto.activo ?? true) });
      setSuccess(`Producto ${producto.activo ? 'desactivado' : 'activado'} correctamente.`);
      await fetchProductos();
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudo actualizar el estado del producto.');
    }
  };

  const deleteProducto = async (producto: Producto) => {
    if (!canManage) return;
    const confirmed = window.confirm(`Eliminar el producto ${producto.codigo} - ${producto.nombre}?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      await api.delete(`/productos/${producto.id}`);
      setSuccess('Producto eliminado correctamente.');
      await fetchProductos();
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudo eliminar el producto.');
    }
  };

  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          No tienes permisos para administrar el catalogo de productos.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-DEFAULT">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona el catalogo central usado por requerimientos, inventario y compras.
          </p>
        </div>
        <Link
          href="/productos/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors"
          style={{ backgroundColor: '#006D77' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
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
        <StatCard label="Total productos" value={productos.length} icon={Package} color="secondary" />
        <StatCard
          label="Activos"
          value={productos.filter((producto) => producto.activo !== false).length}
          icon={Package}
          color="green"
        />
        <StatCard
          label="Inactivos"
          value={productos.filter((producto) => producto.activo === false).length}
          icon={Package}
          color="amber"
        />
      </div>

      <Card title="Catalogo de productos">
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Buscar por codigo, nombre o categoria"
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Cargando productos...</p>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay productos registrados</p>
              <Link href="/productos/nueva" className="mt-3 inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#006D77' }}>
                <Plus className="w-4 h-4" /> Crear el primero
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Codigo</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Nombre</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Categoria</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Unidad</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Precio</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">Estado</th>
                    <th className="py-3 px-2 sm:px-4 font-semibold text-right whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((producto) => (
                    <tr key={producto.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2 sm:px-4 font-mono text-xs">{producto.codigo}</td>
                      <td className="py-3 px-2 sm:px-4">
                        <p className="font-medium text-primary-DEFAULT">{producto.nombre}</p>
                        {producto.descripcion && (
                          <p className="text-xs text-gray-400 mt-0.5">{producto.descripcion}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-4">{producto.categoria}</td>
                      <td className="py-3 px-2 sm:px-4">{producto.unidadMedida}</td>
                      <td className="py-3 px-2 sm:px-4">
                        {producto.precioReferencial !== undefined && producto.precioReferencial !== null
                          ? `S/ ${Number(producto.precioReferencial).toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            producto.activo === false
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {producto.activo === false ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/productos/${producto.id}/editar`}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleActivo(producto)}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50"
                            title={producto.activo === false ? 'Activar' : 'Desactivar'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProducto(producto)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
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
