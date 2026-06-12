'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { LoginResponse } from '@/types';
import { Eye, EyeOff, Package, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
      setAuth(data.user, data.access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al iniciar sesion. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1B263B 0%, #006D77 100%)' }}>
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm">
              <Package className="w-16 h-16 text-accent-DEFAULT" style={{ color: '#D4AF37' }} />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Sistema de Gestion de Compras y Aprovisionamiento
          </h1>
          <p className="text-lg text-white text-opacity-80 mb-8">
            Digitaliza tu proceso de compras desde la solicitud hasta el pago al proveedor.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Requerimientos', desc: 'Solicitudes digitales con flujo de aprobacion' },
              { label: 'Cotizaciones', desc: 'Comparacion de ofertas de proveedores' },
              { label: 'Ordenes de Compra', desc: 'Numeracion correlativa automatica' },
              { label: 'Inventario', desc: 'Control de recepcion y stock' },
            ].map((item) => (
              <div key={item.label} className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                <p className="font-semibold text-sm" style={{ color: '#D4AF37' }}>{item.label}</p>
                <p className="text-xs text-white text-opacity-75 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-white border-opacity-20">
            <p className="text-sm text-white text-opacity-60">
              Universidad Nacional de Trujillo &bull; Ingenieria de Sistemas &bull; VII Ciclo
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Logo mobile */}
            <div className="flex lg:hidden justify-center mb-6">
              <Package className="w-10 h-10" style={{ color: '#006D77' }} />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-primary-DEFAULT" style={{ color: '#1B263B' }}>
                Iniciar Sesion
              </h2>
              <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-field">Correo Electronico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="usuario@sgca.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label-field">Contrasena</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: loading ? '#ccc' : '#006D77',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
              </button>
            </form>

            {/* Credenciales de prueba */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-2">Credenciales de prueba:</p>
              <div className="space-y-1">
                {[
                  { rol: 'Trabajador', email: 'trabajador@sgca.com' },
                  { rol: 'Jefe de Area', email: 'jefe@sgca.com' },
                  { rol: 'Admin', email: 'admin@sgca.com' },
                ].map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => { setEmail(c.email); setPassword('Admin123!'); }}
                    className="w-full text-left text-xs text-blue-600 hover:text-blue-800 py-0.5 hover:underline"
                  >
                    {c.rol}: {c.email}
                  </button>
                ))}
                <p className="text-xs text-blue-500 mt-1">Contrasena: Admin123!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
