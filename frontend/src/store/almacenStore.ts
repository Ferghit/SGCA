'use client';
import { create } from 'zustand';
import api from '@/lib/api';
import { OrdenCompra, Recepcion, InventarioItem, MovimientoInventario, Devolucion } from '@/types';

interface AlmacenState {
  ordenesPendientes: OrdenCompra[];
  recepciones: Recepcion[];
  inventario: InventarioItem[];
  movimientos: MovimientoInventario[];
  devoluciones: Devolucion[];
  isLoading: boolean;
  isLoadingDevoluciones: boolean;
  isLoadingRecepciones: boolean;
  error: string | null;
  errorDevoluciones: string | null;
  fetchOrdenesPendientes: () => Promise<void>;
  fetchRecepciones: () => Promise<void>;
  registrarRecepcion: (data: any) => Promise<any>;
  fetchInventario: () => Promise<void>;
  fetchMovimientos: () => Promise<void>;
  fetchDevoluciones: () => Promise<void>;
  registrarDevolucion: (data: any) => Promise<void>;
}

export const useAlmacenStore = create<AlmacenState>((set) => ({
  ordenesPendientes: [],
  recepciones: [],
  inventario: [],
  movimientos: [],
  devoluciones: [],
  isLoading: false,
  isLoadingDevoluciones: false,
  isLoadingRecepciones: false,
  error: null,
  errorDevoluciones: null,

  fetchOrdenesPendientes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/almacen/ordenes-pendientes');
      set({ ordenesPendientes: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Error al cargar órdenes', isLoading: false });
    }
  },
  fetchRecepciones: async () => {
    set({ isLoadingRecepciones: true, error: null });
    try {
      const { data } = await api.get('/almacen/recepciones');
      set({ recepciones: data, isLoadingRecepciones: false });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Error al cargar recepciones', isLoadingRecepciones: false });
    }
  },
  registrarRecepcion: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/almacen/recepciones', payload);
      set({ isLoading: false });
      return data;
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Error al registrar recepción';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },
  fetchInventario: async () => {
    try {
      const { data } = await api.get('/almacen/inventario');
      set({ inventario: data });
    } catch (e: any) {
      console.error('Error fetching inventario:', e);
    }
  },
  fetchMovimientos: async () => {
    try {
      const { data } = await api.get('/almacen/inventario/movimientos');
      set({ movimientos: data });
    } catch (e: any) {
      console.error('Error fetching movimientos:', e);
    }
  },
  fetchDevoluciones: async () => {
    set({ isLoadingDevoluciones: true, errorDevoluciones: null });
    try {
      const { data } = await api.get('/almacen/devoluciones');
      set({ devoluciones: data, isLoadingDevoluciones: false });
    } catch (e: any) {
      set({ errorDevoluciones: e.response?.data?.message || 'Error al cargar devoluciones', isLoadingDevoluciones: false });
    }
  },
  registrarDevolucion: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/almacen/devoluciones', payload);
      set({ isLoading: false });
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Error al registrar devolución';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },
}));
