import axios from 'axios';
import type {
  OrdenCompra,
  HistorialOrdenCompra,
} from '../types';
import { Rol } from '@prisma/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  activo: boolean;
  createdAt: string;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('sgca-auth');
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sgca-auth');
      document.cookie = 'sgca_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ── Usuarios ───────────────────────────────────────────────────────
export const usersApi = {
  getAll: async () => {
    const response = await api.get<Usuario[]>('/users');
    return response.data;
  },

  create: async (data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol: string;
    activo?: boolean;
  }) => {
    const response = await api.post<Usuario>('/users', data);
    return response.data;
  },

  toggleActivo: async (id: number) => {
    const response = await api.patch<{ id: number; activo: boolean }>(`/users/${id}/toggle-activo`);
    return response.data;
  },
};

// ── Órdenes de Compra ───────────────────────────────────────────────────────
export const ordenesCompraApi = {
  getAll: async () => {
    const response = await api.get<OrdenCompra[]>('/ordenes-compra');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<OrdenCompra>(`/ordenes-compra/${id}`);
    return response.data;
  },

  getExpediente: async (id: number) => {
    const response = await api.get<{ orden: OrdenCompra; expediente: any }>(`/ordenes-compra/${id}/expediente`);
    return response.data;
  },

  generar: async (data: { solicitudCotizacionId: number }) => {
    const response = await api.post<OrdenCompra>('/ordenes-compra/generar', data);
    return response.data;
  },

  aprobar: async (id: number, observaciones?: string) => {
    const response = await api.patch<OrdenCompra>(`/ordenes-compra/${id}/aprobar`, { observaciones });
    return response.data;
  },

  solicitarRevision: async (id: number, justificacion: string) => {
    const response = await api.patch<OrdenCompra>(`/ordenes-compra/${id}/solicitar-revision`, { justificacion });
    return response.data;
  },

  rechazar: async (id: number, justificacion: string) => {
    const response = await api.patch<OrdenCompra>(`/ordenes-compra/${id}/rechazar`, { justificacion });
    return response.data;
  },

  getPendientesRecepcion: async () => {
    const response = await api.get<OrdenCompra[]>('/ordenes-compra/pendientes-recepcion');
    return response.data;
  },

  getPdf: async (id: number) => {
    const response = await api.get(`/ordenes-compra/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },
};

export default api;
