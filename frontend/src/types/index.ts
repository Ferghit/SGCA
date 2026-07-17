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
  | 'APROBADO_GERENTE'
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

export type User = Usuario;

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: string;
  categoria: string;
  precioReferencial?: number;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequerimientoDetalle {
  id: number;
  productoId: number;
  cantidad: number;
  unidadMedida: string;
  observacion?: string;
  producto: Producto;
  cantidadSolicitada?: number;
  stockDisponible?: number;
  cantidadACotizar?: number;
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
  solicitanteId: number;
  aprobadorId?: number | null;
  estado: EstadoRequerimiento;
  prioridad: Prioridad;
  fechaRequerida: string;
  descripcion?: string | null;
  comentarioJefe?: string | null;
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
  ordenCompraId?: number;
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
  riesgoPlazo?: boolean;
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
  plazoMaximoDias?: number;
  requerimiento?: { id: number; codigo: string; descripcion?: string; fechaRequerida?: string };
  analista?: { id: number; nombre: string; apellido: string };
  items: ItemSolicitudCotizacion[];
  ofertas: OfertaProveedor[];
  proveedorGanador?: { id: number; razonSocial: string };
  ordenCompra?: OrdenCompra;
}

export type EstadoOrdenCompra = 'PENDIENTE_APROBACION' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'ENVIADA_PROVEEDOR' | 'EN_RECEPCION' | 'RECEPCION_PARCIAL' | 'RECEPCION_COMPLETA' | 'CERRADA' | 'CANCELADA';
export type EstadoItemRecepcion = 'CONFORME' | 'DANADO' | 'FALTANTE';

export interface Proveedor { id: number; ruc: string; razonSocial: string; email?: string; }

export interface OrdenCompraDetalle {
  id: number; productoId?: number; descripcion: string;
  cantidad: number; precioUnitario: number; subtotal: number;
}

export interface HistorialOrdenCompra {
  id: number; ordenCompraId: number;
  estadoAnterior?: EstadoOrdenCompra;
  estadoNuevo: EstadoOrdenCompra;
  usuarioId?: number;
  observaciones?: string;
  createdAt: string;
  usuario?: Usuario;
}

export interface OrdenCompra {
  id: number; numero: string; solicitudCotizacionId: number;
  ofertaGanadoraId: number; proveedorId: number;
  estado: EstadoOrdenCompra; subtotal: number;
  igv: number; montoTotal: number;
  fechaEmision: string; fechaEntregaEsperada?: string;
  condicionesComerciales?: string; observaciones?: string;
  pdfUrl?: string; gerenteAprobadorId?: number;
  fechaAprobacion?: string; justificacionRevision?: string;
  justificacionRechazo?: string; createdAt: string; updatedAt: string;
  proveedor: Proveedor; detalles: OrdenCompraDetalle[];
  solicitudCotizacion?: SolicitudCotizacion;
  ofertaGanadora?: OfertaProveedor;
  gerenteAprobador?: Usuario;
  historial: HistorialOrdenCompra[];
}

export interface RecepcionDetalle {
  id: number; productoId?: number; descripcion: string;
  cantidadEsperada: number; cantidadRecibida: number;
  estado: EstadoItemRecepcion; observacion?: string;
  producto?: Producto;
}

export interface Recepcion {
  id: number; ordenCompraId: number; fechaRecepcion: string; observaciones?: string;
  ordenCompra: OrdenCompra; detalles: RecepcionDetalle[]; guias?: { id: number; numero: string }[];
}

export interface InventarioItem {
  id: number; productoId: number; cantidad: number; stockMinimo: number;
  stockBajo: boolean; ubicacion?: string; producto: Producto;
}

export interface MovimientoInventario {
  tipo: 'ENTRADA' | 'SALIDA'; producto: string; cantidad: number; fecha: string; referencia: string;
}

export interface Devolucion {
  id: number; 
  recepcionId: number; 
  descripcion: string; 
  cantidad: number; 
  motivo: string;
  notificada: boolean; 
  createdAt: string;
  recepcion?: Recepcion;
}

export type EstadoFactura = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'OBSERVADA' | 'RECHAZADA';
export type EstadoPago = 'PENDIENTE' | 'PROCESADO' | 'OBSERVADO';
export type EstadoCruceFactura = 'CONFORME' | 'OBSERVADA';
export type TipoIncidencia = 'RECLAMO' | 'DEVOLUCION' | 'INCUMPLIMIENTO';
export type EstadoIncidencia = 'ABIERTA' | 'EN_REVISION' | 'RESUELTA';

export interface FacturaDetalle {
  id: number;
  facturaId: number;
  productoId?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ResultadoCruceFactura {
  conforme: boolean;
  discrepancias: string[];
  guias: string[];
  totales: {
    ordenCompra: number;
    factura: number;
    subtotalFactura: number;
    igvFactura: number;
  };
}

export interface Factura {
  id: number;
  numero: string;
  proveedorId: number;
  ordenCompraId?: number;
  monto: number;
  igv: number;
  total: number;
  fechaEmision: string;
  fechaVencimiento?: string;
  estado: EstadoFactura;
  estadoPago: EstadoPago;
  estadoCruce: EstadoCruceFactura;
  resultadoCruce?: ResultadoCruceFactura;
  archivoUrl?: string;
  observacionesCruce?: string;
  createdAt: string;
  updatedAt: string;
  proveedor: Proveedor;
  ordenCompra?: OrdenCompra;
  detalles: FacturaDetalle[];
  pagos: Pago[];
}

export interface Pago {
  id: number;
  facturaId: number;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  referencia?: string;
  estado: EstadoPago;
  observaciones?: string;
  createdAt: string;
  factura?: Factura;
}

export interface IncidenciaProveedor {
  id: number;
  proveedorId: number;
  ordenCompraId?: number;
  tipo: TipoIncidencia;
  estado: EstadoIncidencia;
  descripcion: string;
  impacto: number;
  accionCorrectiva?: string;
  createdAt: string;
  updatedAt: string;
  proveedor: Proveedor;
  ordenCompra?: OrdenCompra;
}

export interface DesempenoProveedor {
  id: number;
  proveedorId: number;
  transacciones: number;
  entregasConformes: number;
  incidencias: number;
  puntajeCumplimiento: number;
  puntajePrecio: number;
  puntajeTotal: number;
  ultimaTransaccion?: string;
  proveedor: Proveedor;
}
