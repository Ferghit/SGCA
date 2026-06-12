import { EstadoRequerimiento, Prioridad } from '@/types';
import { ESTADO_CONFIG, PRIORIDAD_CONFIG } from '@/lib/utils';

interface EstadoBadgeProps {
  estado: EstadoRequerimiento;
  size?: 'sm' | 'md';
}

export function EstadoBadge({ estado, size = 'md' }: EstadoBadgeProps) {
  const config = ESTADO_CONFIG[estado];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${config.color} ${config.bgColor} ${config.borderColor}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {config.label}
    </span>
  );
}

interface PrioridadBadgeProps {
  prioridad: Prioridad;
  size?: 'sm' | 'md';
}

export function PrioridadBadge({ prioridad, size = 'md' }: PrioridadBadgeProps) {
  const config = PRIORIDAD_CONFIG[prioridad];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md ${sizeClass} ${config.color} ${config.bgColor}`}
    >
      {config.label}
    </span>
  );
}
