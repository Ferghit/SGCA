'use client';

import { create } from 'zustand';
import { SolicitudCotizacion } from '@/types';
import api from '@/lib/api';

interface CotizacionesState {
  solicitudes: SolicitudCotizacion[];
  solicitudActual: SolicitudCotizacion | null;
  isLoading: boolean;
  error: string | null;

  fetchSolicitudes: () => Promise<void>;
  fetchSolicitud: (id: number) => Promise<void>;
  crearSolicitud: (data: any) => Promise<SolicitudCotizacion>;
  cerrarSolicitud: (id: number) => Promise<void>;
  seleccionarGanador: (id: number, data: { ofertaId: number; justificacion?: string }) => Promise<void>;
  crearNuevaRonda: (id: number, data: { fechaLimite: string; motivo?: string }) => Promise<SolicitudCotizacion>;
  enviarOferta: (data: any) => Promise<void>;
  clearError: () => void;
}

export const useCotizacionesStore = create<CotizacionesState>((set) => ({
  solicitudes: [],
  solicitudActual: null,
  isLoading: false,
  error: null,

  fetchSolicitudes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/cotizaciones/solicitudes');
      set({ solicitudes: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Error al cargar solicitudes', isLoading: false });
    }
  },

  fetchSolicitud: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/cotizaciones/solicitudes/${id}`);
      set({ solicitudActual: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Error al cargar solicitud', isLoading: false });
    }
  },

  crearSolicitud: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/cotizaciones/solicitudes', payload);
      set((s) => ({ solicitudes: [data, ...s.solicitudes], isLoading: false }));
      return data;
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Error al crear solicitud';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  cerrarSolicitud: async (id) => {
    const { data } = await api.patch(`/cotizaciones/solicitudes/${id}/cerrar`);
    set((s) => ({
      solicitudes: s.solicitudes.map((sol) => (sol.id === id ? data : sol)),
      solicitudActual: data,
    }));
  },

  seleccionarGanador: async (id, payload) => {
    const { data } = await api.patch(`/cotizaciones/solicitudes/${id}/seleccionar-ganador`, payload);
    set((s) => ({
      solicitudes: s.solicitudes.map((sol) => (sol.id === id ? data : sol)),
      solicitudActual: data,
    }));
  },

  crearNuevaRonda: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/cotizaciones/solicitudes/${id}/nueva-ronda`, payload);
      set((s) => ({
        solicitudes: [data, ...s.solicitudes.map((sol) =>
          sol.id === id ? { ...sol, estado: 'CANCELADA' as const } : sol,
        )],
        solicitudActual: data,
        isLoading: false,
      }));
      return data;
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Error al crear la nueva ronda';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  enviarOferta: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/cotizaciones/ofertas', payload);
      set({ isLoading: false });
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Error al enviar oferta';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
}));
