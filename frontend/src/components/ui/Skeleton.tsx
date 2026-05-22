interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'image';
  dark?: boolean;
}

export function Skeleton({ className = '', variant = 'text', dark }: SkeletonProps) {
  const base = `animate-pulse ${dark ? 'bg-gray-700' : 'bg-gray-200'} rounded`;

  if (variant === 'image') {
    return <div className={`${base} aspect-square ${className}`} />;
  }

  if (variant === 'card') {
    return (
      <div className={`${base} p-4 space-y-3 ${className}`}>
        <div className={`aspect-square ${dark ? 'bg-gray-600' : 'bg-gray-300'} rounded-lg`} />
        <div className={`h-4 ${dark ? 'bg-gray-600' : 'bg-gray-300'} rounded w-3/4`} />
        <div className={`h-4 ${dark ? 'bg-gray-600' : 'bg-gray-300'} rounded w-1/2`} />
        <div className={`h-6 ${dark ? 'bg-gray-600' : 'bg-gray-300'} rounded w-1/3`} />
      </div>
    );
  }

  return <div className={`${base} h-4 w-full ${className}`} />;
}

export function ProductCardSkeleton({ dark }: { dark?: boolean }) {
  return (
    <div className={`rounded-xl overflow-hidden border ${dark ? 'bg-gray-800/50 border-gray-800' : 'bg-white border-gray-100'}`}>
      <Skeleton variant="image" className="rounded-none" dark={dark} />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" dark={dark} />
        <Skeleton className="h-5 w-full" dark={dark} />
        <Skeleton className="h-4 w-24" dark={dark} />
        <Skeleton className="h-6 w-20" dark={dark} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, dark }: { rows?: number; dark?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" dark={dark} />
      ))}
    </div>
  );
}
