'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Rol } from '@/types';
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Users,
  Bell,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const MENU_BY_ROL: Record<Rol, MenuItem[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Usuarios', href: '/usuarios', icon: Users },
    { label: 'Productos', href: '/productos', icon: Package },
    { label: 'Requerimientos', href: '/requerimientos', icon: ClipboardList },
    { label: 'Recepciones', href: '/recepciones', icon: Package },
    { label: 'Inventario', href: '/inventario', icon: Package },
    { label: 'Devoluciones', href: '/devoluciones', icon: Package },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  ],
  TRABAJADOR: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Mis Requerimientos', href: '/requerimientos', icon: ClipboardList },
    { label: 'Nuevo Requerimiento', href: '/requerimientos/nuevo', icon: Plus },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  ],
  JEFE_AREA: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Requerimientos', href: '/requerimientos', icon: ClipboardList },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  ],
  ANALISTA_COMPRAS: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Productos', href: '/productos', icon: Package },
    { label: 'Requerimientos', href: '/requerimientos', icon: ClipboardList },
    { label: 'Solicitudes de Cotización', href: '/cotizaciones', icon: FileText },
    { label: 'Ordenes de Compra', href: '/ordenes-compra', icon: ShoppingCart },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  ],
  GERENTE: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Productos', href: '/productos', icon: Package },
    { label: 'Requerimientos', href: '/requerimientos', icon: ClipboardList },
    { label: 'Recepciones', href: '/recepciones', icon: Package },
    { label: 'Inventario', href: '/inventario', icon: Package },
    { label: 'Devoluciones', href: '/devoluciones', icon: Package },
    { label: 'Reportes', href: '/reportes', icon: BarChart3 },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  ],
  PROVEEDOR: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Cotizaciones Abiertas', href: '/cotizaciones', icon: FileText },
    { label: 'Mis Cotizaciones', href: '/cotizaciones/mis-ofertas', icon: ShoppingCart },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  ],
  ENCARGADO_ALMACEN: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Productos', href: '/productos', icon: Package },
    { label: 'Recepciones', href: '/recepciones', icon: Package },
    { label: 'Inventario', href: '/inventario', icon: Package },
    { label: 'Devoluciones', href: '/devoluciones', icon: Package },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  ],
  CONTADOR: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Facturas', href: '/facturas', icon: FileText },
    { label: 'Pagos', href: '/pagos', icon: FileText },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const menuItems = MENU_BY_ROL[user.rol] || [];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Header del sidebar */}
      <div className="px-4 py-5 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu principal</p>
      </div>

      {/* Menu items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-secondary-DEFAULT text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary-DEFAULT'
                }
              `}
              style={isActive ? { backgroundColor: '#006D77' } : {}}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-secondary-DEFAULT'}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white text-opacity-70" />}
              {item.badge && (
                <span className="ml-auto bg-accent-DEFAULT text-primary-DEFAULT text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#D4AF37', color: '#1B263B' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">SGCA v1.0.0</p>
        <p className="text-xs text-gray-300">UNT Sistemas VII &copy; 2026</p>
      </div>
    </aside>
  );
}
