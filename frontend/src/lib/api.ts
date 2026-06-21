import axios from 'axios';
import type {
  DesempenoProveedor,
  Factura,
  IncidenciaProveedor,
  OrdenCompra,
  Pago,
} from '../types';

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

export const contabilidadApi = {
  getOrdenesParaFacturar: async () => {
    const response = await api.get<OrdenCompra[]>('/contabilidad/ordenes-para-facturar');
    return response.data;
  },

  getFacturas: async () => {
    const response = await api.get<Factura[]>('/contabilidad/facturas');
    return response.data;
  },

  getFactura: async (id: number) => {
    const response = await api.get<Factura>(`/contabilidad/facturas/${id}`);
    return response.data;
  },

  crearFactura: async (data: {
    numero: string;
    ordenCompraId: number;
    fechaEmision: string;
    fechaVencimiento?: string;
    archivoUrl?: string;
    detalles: Array<{ productoId?: number; descripcion: string; cantidad: number; precioUnitario: number }>;
  }) => {
    const response = await api.post<Factura>('/contabilidad/facturas', data);
    return response.data;
  },

  actualizarPago: async (
    id: number,
    data: { estado: 'PENDIENTE' | 'PROCESADO' | 'OBSERVADO'; monto?: number; metodoPago?: string; referencia?: string; observaciones?: string },
  ) => {
    const response = await api.patch<Factura>(`/contabilidad/facturas/${id}/pago`, data);
    return response.data;
  },

  getFacturaPdf: async (id: number) => {
    const response = await api.get(`/contabilidad/facturas/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  getPagos: async () => {
    const response = await api.get<Pago[]>('/contabilidad/pagos');
    return response.data;
  },

  getIncidencias: async () => {
    const response = await api.get<IncidenciaProveedor[]>('/contabilidad/incidencias');
    return response.data;
  },

  crearIncidencia: async (data: {
    proveedorId: number;
    ordenCompraId?: number;
    tipo: 'RECLAMO' | 'DEVOLUCION' | 'INCUMPLIMIENTO';
    descripcion: string;
    impacto?: number;
    accionCorrectiva?: string;
  }) => {
    const response = await api.post<IncidenciaProveedor>('/contabilidad/incidencias', data);
    return response.data;
  },

  resolverIncidencia: async (id: number) => {
    const response = await api.patch<IncidenciaProveedor>(`/contabilidad/incidencias/${id}/resolver`);
    return response.data;
  },

  getDesempenoProveedores: async () => {
    const response = await api.get<DesempenoProveedor[]>('/contabilidad/desempeno-proveedores');
    return response.data;
  },
};

// ── Reportes ───────────────────────────────────────────────────────
export const reportesApi = {
  getKPIs: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/kpis?${params.toString()}`);
    return response.data;
  },
  getReporteCompras: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/compras?${params.toString()}`);
    return response.data;
  },
  getReporteProveedores: async () => {
    const response = await api.get('/reportes/proveedores');
    return response.data;
  },
  getProductosRotacion: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/productos/rotacion?${params.toString()}`);
    return response.data;
  },
  getStockCritico: async () => {
    const response = await api.get('/reportes/productos/stock-critico');
    return response.data;
  },
  downloadComprasPDF: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/compras/pdf?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  downloadProveedoresPDF: async () => {
    const response = await api.get('/reportes/proveedores/pdf', {
      responseType: 'blob',
    });
    return response.data;
  },
  downloadStockCriticoPDF: async () => {
    const response = await api.get('/reportes/productos/stock-critico/pdf', {
      responseType: 'blob',
    });
    return response.data;
  },

  // --- OPERATIONAL REPORTS ---
  getOperativoUsuarios: async () => {
    const response = await api.get('/reportes/operativos/usuarios');
    return response.data;
  },
  getOperativoProductos: async () => {
    const response = await api.get('/reportes/operativos/productos');
    return response.data;
  },
  getOperativoRequerimientos: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/operativos/requerimientos?${params.toString()}`);
    return response.data;
  },
  getOperativoSolicitudesCotizacion: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/operativos/solicitudes-cotizacion?${params.toString()}`);
    return response.data;
  },
  getOperativoOrdenesCompra: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/operativos/ordenes-compra?${params.toString()}`);
    return response.data;
  },
  getOperativoRecepciones: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/operativos/recepciones?${params.toString()}`);
    return response.data;
  },
  getOperativoInventario: async () => {
    const response = await api.get('/reportes/operativos/inventario');
    return response.data;
  },
  downloadOperativoUsuariosPDF: async () => {
    const response = await api.get('/reportes/operativos/usuarios/pdf', { responseType: 'blob' });
    return response.data;
  },
  downloadOperativoProductosPDF: async () => {
    const response = await api.get('/reportes/operativos/productos/pdf', { responseType: 'blob' });
    return response.data;
  },
  downloadOperativoRequerimientosPDF: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/operativos/requerimientos/pdf?${params.toString()}`, { responseType: 'blob' });
    return response.data;
  },
  downloadOperativoSolicitudesCotizacionPDF: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/operativos/solicitudes-cotizacion/pdf?${params.toString()}`, { responseType: 'blob' });
    return response.data;
  },
  downloadOperativoOrdenesCompraPDF: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/operativos/ordenes-compra/pdf?${params.toString()}`, { responseType: 'blob' });
    return response.data;
  },
  downloadOperativoRecepcionesPDF: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await api.get(`/reportes/operativos/recepciones/pdf?${params.toString()}`, { responseType: 'blob' });
    return response.data;
  },
  downloadOperativoInventarioPDF: async () => {
    const response = await api.get('/reportes/operativos/inventario/pdf', { responseType: 'blob' });
    return response.data;
  },
};

export default api;
