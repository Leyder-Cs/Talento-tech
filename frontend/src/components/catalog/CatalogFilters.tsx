import { useCallback, useMemo } from 'react';

interface CatalogFiltersProps {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function CatalogFilters({ searchParams, setSearchParams, isOpen, onToggle }: CatalogFiltersProps) {
  const updateParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  }, [setSearchParams]);

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

  const sidebarContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emphasis uppercase tracking-wider">Filtros</h3>
        {activeCount > 0 && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
            {activeCount}
          </span>
        )}
      </div>

      {/* Precio */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Precio
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 text-emphasis rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <input
            type="number"
            min={0}
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 text-emphasis rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Stock */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-accent focus:ring-accent focus:ring-offset-0"
          />
          <span className="text-sm text-emphasis">Solo en stock</span>
        </label>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Rating mínimo
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => updateParam('minRating', minRating === star ? '' : String(star))}
              className="p-0.5 transition-colors"
            >
              <svg
                className={`w-5 h-5 ${star <= minRating ? 'text-yellow-400' : 'text-gray-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        {minRating > 0 && (
          <p className="text-xs text-gray-500 mt-1">{minRating} estrella{minRating > 1 ? 's' : ''} o más</p>
        )}
      </div>

      {/* Destacados */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => updateParam('featured', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-accent focus:ring-accent focus:ring-offset-0"
          />
          <span className="text-sm text-emphasis">Solo destacados</span>
        </label>
      </div>

      {/* Limpiar filtros */}
      {activeCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full px-3 py-2 text-sm font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 sticky top-24">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile: toggle button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-full shadow-lg hover:bg-accent/90 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onToggle} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-gray-900 border-r border-white/5 shadow-xl p-5 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-emphasis uppercase tracking-wider">Filtros</h3>
              <button onClick={onToggle} className="text-gray-400 hover:text-emphasis transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
