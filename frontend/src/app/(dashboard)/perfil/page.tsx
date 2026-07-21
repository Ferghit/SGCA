'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ROL_LABELS, formatDate } from '@/lib/utils';
import { authApi } from '@/lib/api';
import { User, Mail, Shield, Calendar, Edit2, Lock, Save, X, Eye, EyeOff } from 'lucide-react';

export default function PerfilPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updatedUser = await authApi.updateProfile(profileForm);
      updateUser(updatedUser);
      setIsEditingProfile(false);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al actualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al cambiar contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: '#1B263B' }}>Mi Perfil</h1>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

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

      {/* Formulario de edición de perfil */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Informacion de la cuenta
          </h3>
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isEditingProfile ? 'Cancelar edición' : 'Editar perfil'}
          >
            {isEditingProfile ? <X className="w-4 h-4 text-gray-500" /> : <Edit2 className="w-4 h-4 text-gray-500" />}
          </button>
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre</label>
              <input
                type="text"
                value={profileForm.nombre}
                onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Apellido</label>
              <input
                type="text"
                value={profileForm.apellido}
                onChange={(e) => setProfileForm({ ...profileForm, apellido: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#006D77' }}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileForm({ nombre: user.nombre, apellido: user.apellido, email: user.email });
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Cambio de contraseña */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Seguridad
          </h3>
          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isChangingPassword ? 'Cancelar' : 'Cambiar contraseña'}
          >
            {isChangingPassword ? <X className="w-4 h-4 text-gray-500" /> : <Lock className="w-4 h-4 text-gray-500" />}
          </button>
        </div>

        {isChangingPassword ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres, mayúscula, minúscula y número</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Confirmar nueva contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#006D77' }}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Contraseña</p>
              <p className="text-sm font-medium text-gray-800">••••••••</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
