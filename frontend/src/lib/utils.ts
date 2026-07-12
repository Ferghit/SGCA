import { EstadoRequerimiento, Prioridad, Rol, EstadoOrdenCompra } from '@/types';

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateOnly(dateString: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);

  if (match) {
    const [, year, month, day] = match;
    const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));

    return utcDate.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Lima',
    });
  }

  return formatDate(dateString);
}

export function getLocalDateInputValue(baseDate = new Date()): string {
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getDateInputValue(dateString: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  return getLocalDateInputValue(new Date(dateString));
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PE', {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
}

export const ESTADO_CONFIG: Record<
  EstadoRequerimiento,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  BORRADOR: {
    label: 'Borrador',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  PENDIENTE: {
    label: 'Pendiente',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
  },
  APROBADO: {
    label: 'Aprobado por Jefatura',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
  },
  APROBADO_GERENTE: {
    label: 'Aprobado por Gerencia',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  RECHAZADO: {
    label: 'Rechazado',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
  EN_REVISION: {
    label: 'En Revision',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
};

export const ESTADO_OC_CONFIG: Record<
  EstadoOrdenCompra,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  PENDIENTE_APROBACION: {
    label: 'Pendiente de Aprobacion',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
  },
  EN_REVISION: {
    label: 'En Revision',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  APROBADA: {
    label: 'Aprobada',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  RECHAZADA: {
    label: 'Rechazada',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
  ENVIADA_PROVEEDOR: {
    label: 'Enviada a Proveedor',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
  },
  EN_RECEPCION: {
    label: 'En Recepcion',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
  },
  RECEPCION_PARCIAL: {
    label: 'Recepcion Parcial',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
  },
  RECEPCION_COMPLETA: {
    label: 'Recepcion Completa',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
  },
  CERRADA: {
    label: 'Cerrada',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400',
  },
};

export const PRIORIDAD_CONFIG: Record<
  Prioridad,
  { label: string; color: string; bgColor: string; order: number }
> = {
  BAJA: { label: 'Baja', color: 'text-gray-600', bgColor: 'bg-gray-100', order: 1 },
  MEDIA: { label: 'Media', color: 'text-blue-600', bgColor: 'bg-blue-50', order: 2 },
  ALTA: { label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-50', order: 3 },
  URGENTE: { label: 'Urgente', color: 'text-red-600', bgColor: 'bg-red-100', order: 4 },
};

export const ROL_LABELS: Record<Rol, string> = {
  ADMIN: 'Administrador',
  TRABAJADOR: 'Trabajador',
  JEFE_AREA: 'Jefe de Area',
  ANALISTA_COMPRAS: 'Analista de Compras',
  GERENTE: 'Gerente',
  PROVEEDOR: 'Proveedor',
  ENCARGADO_ALMACEN: 'Encargado de Almacen',
  CONTADOR: 'Contador',
};

export function getErrorMessage(error: unknown): string {
  if (axios_isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || 'Error de conexion con el servidor';
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

function axios_isAxiosError(error: unknown): error is { response?: { data?: { message?: string | string[] } } } {
  return typeof error === 'object' && error !== null && 'response' in error;
}
