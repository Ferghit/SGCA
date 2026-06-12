import { EstadoRequerimiento, Prioridad, Rol } from '@/types';

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
    label: 'Aprobado',
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
