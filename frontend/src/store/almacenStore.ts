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
  error: string | null; 
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
  error: null, 
 
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
    const { data } = await api.get('/almacen/recepciones'); 
    set({ recepciones: data }); 
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
    const { data } = await api.get('/almacen/inventario'); 
    set({ inventario: data }); 
  }, 
  fetchMovimientos: async () => { 
    const { data } = await api.get('/almacen/inventario/movimientos'); 
    set({ movimientos: data }); 
  }, 
  fetchDevoluciones: async () => { 
    const { data } = await api.get('/almacen/devoluciones'); 
    set({ devoluciones: data }); 
  }, 
  registrarDevolucion: async (payload) => { 
    await api.post('/almacen/devoluciones', payload); 
  }, 
}));
