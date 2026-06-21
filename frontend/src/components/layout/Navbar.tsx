'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ROL_LABELS } from '@/lib/utils';
import { Bell, LogOut, User, ChevronDown, Package, Menu } from 'lucide-react';
import api from '@/lib/api';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [notifCount, setNotifCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/notificaciones/no-leidas/count');
        setNotifCount(data.count);
      } catch {
        // silencioso
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav
      className="h-16 text-white flex items-center justify-between px-4 sm:px-6 shadow-lg z-30 flex-shrink-0"
      style={{ backgroundColor: '#1B263B' }}
    >
      {/* Logo, nombre y botón hamburguesa */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'white' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="rounded-lg p-1.5" style={{ backgroundColor: '#006D77' }}>
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-wide text-white">SGCA</span>
          <span className="hidden sm:inline text-xs ml-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Sistema de Gestion de Compras
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button
          onClick={() => router.push('/notificaciones')}
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'white' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span
              className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              style={{ backgroundColor: '#D4AF37', color: '#1B263B' }}
            >
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>

        {/* Menu usuario */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-white"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: '#006D77' }}
            >
              {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none text-white">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {user?.rol ? ROL_LABELS[user.rol] : ''}
              </p>
            </div>
            <ChevronDown className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-sm" style={{ color: '#1B263B' }}>
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <span
                  className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium"
                  style={{ backgroundColor: '#E0F2F3', color: '#006D77' }}
                >
                  {user?.rol ? ROL_LABELS[user.rol] : ''}
                </span>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); router.push('/perfil'); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Mi Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
