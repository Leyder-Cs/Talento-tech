import { useCallback, useMemo } from 'react';

interface HorizontalFiltersProps {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => void;
  variant?: 'inline' | 'dropdown';
}

export function HorizontalFilters({ searchParams, setSearchParams, variant = 'inline' }: HorizontalFiltersProps) {
  const updateParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        if (value) prev.set(key, value);
        else prev.delete(key);
        prev.set('page', '1');
        return prev;
      });
    },
    [setSearchParams],
  );

  const activeCount = useMemo(() => {
    let count = 0;
    if (searchParams.has('minPrice')) count++;
    if (searchParams.has('maxPrice')) count++;
    if (searchParams.get('inStock') === 'true') count++;
    if (searchParams.has('minRating')) count++;
    if (searchParams.get('featured') === 'true') count++;
    return count;
  }, [searchParams]);

  const clearFilters = () => {
    setSearchParams((prev) => {
      prev.delete('minPrice');
      prev.delete('maxPrice');
      prev.delete('inStock');
      prev.delete('minRating');
      prev.delete('featured');
      prev.set('page', '1');
      return prev;
    });
  };

  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const minRating = Number(searchParams.get('minRating')) || 0;
  const featured = searchParams.get('featured') === 'true';

  const controls = (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* Precio */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500">Precio:</label>
        <input
          type="number"
          min={0}
          placeholder="Mín"
          value={minPrice}
          onChange={(e) => updateParam('minPrice', e.target.value)}
          className="w-20 px-2 py-1.5 text-xs bg-gray-900 border border-gray-700 text-emphasis rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-gray-600 text-xs">—</span>
        <input
          type="number"
          min={0}
          placeholder="Máx"
          value={maxPrice}
          onChange={(e) => updateParam('maxPrice', e.target.value)}
          className="w-20 px-2 py-1.5 text-xs bg-gray-900 border border-gray-700 text-emphasis rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Stock */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
          className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-900 text-accent focus:ring-accent focus:ring-offset-0"
        />
        <span className="text-xs text-emphasis whitespace-nowrap">Solo en stock</span>
      </label>

      {/* Rating */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Rating:</label>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => updateParam('minRating', minRating === star ? '' : String(star))}
              className="p-0.5 transition-colors"
            >
              <svg
                className={`w-4 h-4 ${star <= minRating ? 'text-yellow-400' : 'text-gray-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        {minRating > 0 && (
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {minRating}+
          </span>
        )}
      </div>

      {/* Destacados */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => updateParam('featured', e.target.checked ? 'true' : '')}
          className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-900 text-accent focus:ring-accent focus:ring-offset-0"
        />
        <span className="text-xs text-emphasis whitespace-nowrap">Destacados</span>
      </label>

      {/* Limpiar */}
      {activeCount > 0 && (
        <button
          onClick={clearFilters}
          className="text-xs font-medium text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  if (variant === 'dropdown') {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Filtros
            {activeCount > 0 && (
            <span className="ml-1.5 text-xs bg-gray-700 text-gray-200 px-1.5 py-0.5 rounded-full font-medium">
                {activeCount}
              </span>
            )}
          </span>
        </div>
        {controls}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 bg-gray-800/40 border border-gray-700/50 rounded-xl px-4 py-2.5">
      {/* Fila 1: Label + Precio */}
      <div className="flex items-center gap-x-5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          <span className={`inline-flex items-center justify-center text-[10px] font-bold bg-gray-700 text-gray-200 w-[18px] h-[18px] rounded-full transition-opacity duration-200 ${activeCount > 0 ? 'opacity-100' : 'opacity-0'}`}>
            {activeCount || 0}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 font-medium">Precio:</label>
          <input
            type="number" min={0} placeholder="Mín" value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-[68px] px-2 py-1.5 text-xs bg-gray-900/80 border border-gray-600/60 text-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500/40 placeholder-gray-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-gray-600 text-xs font-medium">—</span>
          <input
            type="number" min={0} placeholder="Máx" value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-[68px] px-2 py-1.5 text-xs bg-gray-900/80 border border-gray-600/60 text-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500/40 placeholder-gray-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Fila 2: Rating + Destacados + Limpiar */}
      <div className="flex items-center gap-x-5 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 font-medium">Rating:</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= minRating;
              return (
                <button key={star} type="button"
                  onClick={() => updateParam('minRating', minRating === star ? '' : String(star))}
                  className={`relative p-0.5 rounded transition-all duration-150 ${active ? 'scale-100' : 'hover:scale-110'}`}
                >
                  {active ? (
                    <svg className="w-4 h-4 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          <span className={`text-[11px] text-gray-500 whitespace-nowrap transition-opacity duration-200 font-medium ${minRating > 0 ? 'opacity-100' : 'opacity-0'}`}>
            {minRating > 0 ? `${minRating}+` : '0+'}
          </span>
        </div>
        <div className="w-px h-5 bg-gray-700/60 flex-shrink-0" />
        <label className="flex items-center gap-2 cursor-pointer group select-none">
          <span className="relative flex items-center justify-center w-4 h-4 rounded border transition-colors flex-shrink-0 bg-gray-900/80 border-gray-600 group-hover:border-gray-400">
            <input type="checkbox" checked={featured}
              onChange={(e) => updateParam('featured', e.target.checked ? 'true' : '')}
              className="sr-only"
            />
            {featured && (
              <svg className="w-3 h-3 text-green-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <span className="text-[11px] text-gray-300 group-hover:text-gray-200 transition-colors whitespace-nowrap font-medium">Destacados</span>
        </label>
        <button onClick={clearFilters}
          className={`text-[11px] font-semibold whitespace-nowrap transition-all duration-200 underline underline-offset-2 decoration-gray-600/40 hover:decoration-gray-400 ${activeCount > 0 ? 'opacity-100 text-gray-400 hover:text-gray-200 pointer-events-auto' : 'opacity-0 pointer-events-none text-gray-600'}`}
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
