interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  dark?: boolean;
}

const variants = {
  default: { light: 'bg-gray-100 text-gray-700', dark: 'bg-gray-700 text-gray-300' },
  success: { light: 'bg-green-100 text-green-700', dark: 'bg-emerald-500/15 text-emerald-400' },
  warning: { light: 'bg-yellow-100 text-yellow-700', dark: 'bg-amber-500/15 text-amber-400' },
  danger: { light: 'bg-red-100 text-red-700', dark: 'bg-red-500/15 text-red-400' },
  info: { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-500/15 text-blue-400' },
};

export function Badge({ children, variant = 'default', className = '', dark = true }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant][dark ? 'dark' : 'light']} ${className}`}
    >
      {children}
    </span>
  );
}
