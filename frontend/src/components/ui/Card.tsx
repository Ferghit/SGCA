interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-card border border-gray-100 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="font-semibold text-primary-DEFAULT text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={title ? 'p-6' : 'p-6'}>{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'secondary' | 'accent' | 'green' | 'red' | 'amber' | 'blue';
  trend?: string;
}

const COLOR_MAP = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-DEFAULT', border: 'border-primary-100' },
  secondary: { bg: 'bg-secondary-50', icon: 'text-secondary-DEFAULT', border: 'border-secondary-100' },
  accent: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
};

export function StatCard({ label, value, icon: Icon, color = 'secondary', trend }: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div className={`bg-white rounded-xl border shadow-card p-5 ${colors.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-primary-DEFAULT mt-1">{value}</p>
          {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
        </div>
        <div className={`${colors.bg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
