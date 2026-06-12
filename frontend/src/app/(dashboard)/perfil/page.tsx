'use client';

import { useAuthStore } from '@/store/authStore';
import { ROL_LABELS, formatDate } from '@/lib/utils';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function PerfilPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: '#1B263B' }}>Mi Perfil</h1>

      {/* Avatar y nombre */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
          style={{ backgroundColor: '#006D77' }}
        >
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#1B263B' }}>
            {user.nombre} {user.apellido}
          </h2>
          <span
            className="inline-block mt-1 px-3 py-0.5 text-xs font-semibold rounded-full"
            style={{ backgroundColor: '#E0F2F3', color: '#006D77' }}
          >
            {ROL_LABELS[user.rol]}
          </span>
        </div>
      </div>

      {/* Datos de la cuenta */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Informacion de la cuenta
        </h3>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <User className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Nombre completo</p>
            <p className="text-sm font-medium text-gray-800">{user.nombre} {user.apellido}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Mail className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Correo electronico</p>
            <p className="text-sm font-medium text-gray-800">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Shield className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Rol en el sistema</p>
            <p className="text-sm font-medium text-gray-800">{ROL_LABELS[user.rol]}</p>
          </div>
        </div>

        {user.createdAt && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Miembro desde</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className={`w-4 h-4 rounded-full ${user.activo ? 'bg-green-500' : 'bg-red-400'}`} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Estado</p>
            <p className={`text-sm font-medium ${user.activo ? 'text-green-600' : 'text-red-500'}`}>
              {user.activo ? 'Cuenta activa' : 'Cuenta inactiva'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
