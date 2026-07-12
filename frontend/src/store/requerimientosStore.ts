'use client';

import { create } from 'zustand';
import { Requerimiento, EstadisticasTrabajador, EstadisticasJefe } from '@/types';
import api from '@/lib/api';

interface RequerimientosState {
  requerimientos: Requerimiento[];
  currentRequerimiento: Requerimiento | null;
  estadisticasTrabajador: EstadisticasTrabajador | null;
  estadisticasJefe: EstadisticasJefe | null;
  isLoading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchPendientes: () => Promise<void>;
  fetchById: (id: number) => Promise<void>;
  create: (data: unknown) => Promise<Requerimiento>;
  update: (id: number, data: unknown) => Promise<Requerimiento>;
  enviarParaAprobacion: (id: number) => Promise<void>;
  updateEstado: (id: number, data: { estado: string; comentario?: string }) => Promise<Requerimiento>;
  fetchEstadisticasTrabajador: () => Promise<void>;
  fetchEstadisticasJefe: () => Promise<void>;
  clearError: () => void;
  clearCurrent: () => void;
}

export const useRequerimientosStore = create<RequerimientosState>((set, get) => ({
  requerimientos: [],
  currentRequerimiento: null,
  estadisticasTrabajador: null,
  estadisticasJefe: null,
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/requerimientos');
      set({ requerimientos: data });
    } catch (e: unknown) {
      set({ error: getMsg(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendientes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/requerimientos/pendientes');
      set({ requerimientos: data });
    } catch (e: unknown) {
      set({ error: getMsg(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/requerimientos/${id}`);
      set({ currentRequerimiento: data });
    } catch (e: unknown) {
      set({ error: getMsg(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (formData: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/requerimientos', formData);
      await get().fetchAll();
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e);
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  update: async (id: number, formData: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.patch(`/requerimientos/${id}`, formData);
      set({ currentRequerimiento: data });
      await get().fetchAll();
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e);
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  enviarParaAprobacion: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/requerimientos/${id}/enviar`);
      await get().fetchAll();
    } catch (e: unknown) {
      const msg = getMsg(e);
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  updateEstado: async (id: number, formData: { estado: string; comentario?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.patch(`/requerimientos/${id}/estado`, formData);
      set({ currentRequerimiento: data });
      await get().fetchAll();
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e);
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchEstadisticasTrabajador: async () => {
    try {
      const { data } = await api.get('/requerimientos/estadisticas/mis-requerimientos');
      set({ estadisticasTrabajador: data });
    } catch {
      // silencioso
    }
  },

  fetchEstadisticasJefe: async () => {
    try {
      const { data } = await api.get('/requerimientos/estadisticas/jefe');
      set({ estadisticasJefe: data });
    } catch {
      // silencioso
    }
  },

  clearError: () => set({ error: null }),
  clearCurrent: () => set({ currentRequerimiento: null }),
}));

function getMsg(e: unknown): string {
  if (typeof e === 'object' && e !== null) {
    const err = e as { response?: { data?: { message?: unknown } } };
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  if (e instanceof Error) return e.message;
  return 'Error desconocido';
}
