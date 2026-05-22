interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  dark?: boolean;
}

export function Pagination({ page, totalPages, onPageChange, dark }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const btnBase = dark
    ? 'text-gray-400 bg-white/10 border-white/20 hover:bg-white/20'
    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50';

  return (
    <nav className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnBase}`}
      >
        Anterior
      </button>
      {pages.map((p, i) =>
        typeof p === 'number' ? (
          <button
            key={i}
            onClick={() => onPageChange(p)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              p === page
                ? dark ? 'bg-accent text-white' : 'bg-primary text-white'
                : btnBase
            }`}
          >
            {p}
          </button>
        ) : (
          <span key={i} className={`px-2 py-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            ...
          </span>
        ),
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnBase}`}
      >
        Siguiente
      </button>
    </nav>
  );
}
