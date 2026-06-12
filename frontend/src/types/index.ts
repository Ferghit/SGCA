export type Rol =
  | 'ADMIN'
  | 'TRABAJADOR'
  | 'JEFE_AREA'
  | 'ANALISTA_COMPRAS'
  | 'GERENTE'
  | 'PROVEEDOR'
  | 'ENCARGADO_ALMACEN'
  | 'CONTADOR';

export type EstadoRequerimiento =
  | 'BORRADOR'
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'EN_REVISION';

export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt?: string;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: string;
  categoria: string;
  precioReferencial?: number;
}

export interface RequerimientoDetalle {
  id: number;
  productoId: number;
  cantidad: number;
  unidadMedida: string;
  observacion?: string;
  producto: Producto;
}

export interface HistorialRequerimiento {
  id: number;
  estadoAnterior?: EstadoRequerimiento;
  estadoNuevo: EstadoRequerimiento;
  comentario?: string;
  usuarioId?: number;
  createdAt: string;
}

export interface Requerimiento {
  id: number;
  codigo: string;
  estado: EstadoRequerimiento;
  prioridad: Prioridad;
  fechaRequerida: string;
  descripcion?: string;
  comentarioJefe?: string;
  createdAt: string;
  updatedAt: string;
  solicitante: Usuario;
  aprobador?: Usuario;
  detalles: RequerimientoDetalle[];
  historial: HistorialRequerimiento[];
}

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
  requerimientoId?: number;
  requerimiento?: { id: number; codigo: string };
  emisor?: { id: number; nombre: string; apellido: string };
}

export interface LoginResponse {
  access_token: string;
  user: Usuario;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface EstadisticasTrabajador {
  total: number;
  borrador: number;
  pendiente: number;
  aprobado: number;
  rechazado: number;
  enRevision: number;
}

export interface EstadisticasJefe {
  total: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
  enRevision: number;
}

// ── Cotizaciones ─────────────────────────────────────────────────────────────

export type EstadoSolicitudCotizacion =
  | 'ABIERTA'
  | 'CERRADA'
  | 'ADJUDICADA'
  | 'CANCELADA';

export type EstadoOferta = 'RECIBIDA' | 'SELECCIONADA' | 'RECHAZADA';

export interface ItemSolicitudCotizacion {
  id: number;
  solicitudCotizacionId: number;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
}

export interface OfertaProveedor {
  id: number;
  solicitudCotizacionId: number;
  proveedorId: number;
  montoTotal: number;
  plazoEntregaDias: number;
  condicionesPago?: string;
  notasAdicionales?: string;
  archivoAdjuntoUrl?: string;
  estado: EstadoOferta;
  puntajePrecio?: number;
  puntajePlazo?: number;
  puntajeHistorial?: number;
  puntajeTotal?: number;
  posicionRanking?: number;
  createdAt: string;
  proveedor: { id: number; razonSocial: string; ruc: string; email?: string };
  solicitudCotizacion?: SolicitudCotizacion;
}

export interface SolicitudCotizacion {
  id: number;
  codigo: string;
  requerimientoId: number;
  analistaId: number;
  titulo: string;
  descripcion?: string;
  fechaLimite: string;
  estado: EstadoSolicitudCotizacion;
  proveedorGanadorId?: number;
  justificacionSeleccion?: string;
  createdAt: string;
  updatedAt: string;
  requerimiento?: { id: number; codigo: string; descripcion?: string };
  analista?: { id: number; nombre: string; apellido: string };
  items: ItemSolicitudCotizacion[];
  ofertas: OfertaProveedor[];
  proveedorGanador?: { id: number; razonSocial: string };
}