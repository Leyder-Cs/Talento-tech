import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  dark?: boolean;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  dark,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon || (
        <svg
          className={`w-16 h-16 ${dark ? 'text-gray-600' : 'text-gray-300'} mb-4`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      )}
      <h3 className={`text-lg font-medium ${dark ? 'text-gray-300' : 'text-gray-900'} mb-1`}>{title}</h3>
      {message && (
        <p className={`${dark ? 'text-gray-500' : 'text-gray-500'} mb-6 max-w-sm`}>{message}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
