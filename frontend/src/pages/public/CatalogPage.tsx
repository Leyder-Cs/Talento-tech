import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../../components/catalog/ProductCard';
import { Pagination } from '../../components/ui/Pagination';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { HorizontalFilters } from '../../components/catalog/HorizontalFilters';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  const { data, isLoading } = useProducts({
    page: currentPage,
    limit: 12,
    category: currentCategory || undefined,
    search: searchParams.get('search') || undefined,
    sort: currentSort,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    inStock: searchParams.get('inStock') || undefined,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    featured: searchParams.get('featured') || undefined,
  });

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  const sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
    { value: 'name_asc', label: 'Nombre A-Z' },
  ];

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* ─── Toolbar: sort + count ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          {/* Left: filters */}
          <HorizontalFilters
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            variant="inline"
          />

          {/* Right: pill + count + sort */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto -mr-4 sm:-mr-6 lg:-mr-8">
            {currentCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm text-gray-100 bg-gray-700 rounded-lg">
                <span className="truncate max-w-28">{currentCategory}</span>
                <button
                  onClick={() => updateParam('category', '')}
                  className="hover:text-gray-300 transition-colors flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <p className="text-sm text-gray-500 whitespace-nowrap">
              {data && (
                <>{data.meta.total} producto{data.meta.total !== 1 ? 's' : ''}</>
              )}
            </p>
            <select
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 text-emphasis rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-gray-300 bg-gray-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Active filter chips ─── */}
        {(searchParams.has('minPrice') || searchParams.has('maxPrice') || searchParams.get('featured') === 'true' || searchParams.has('minRating')) && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {searchParams.has('minPrice') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-300 bg-gray-800/70 border border-gray-700/50 rounded-full">
                Precio: {searchParams.get('minPrice') === '' ? '$0' : `$${searchParams.get('minPrice')}`}{searchParams.has('maxPrice') ? ` — $${searchParams.get('maxPrice')}` : ''}
                <button onClick={() => { setSearchParams((prev) => { prev.delete('minPrice'); prev.delete('maxPrice'); prev.set('page', '1'); return prev; }); }} className="ml-0.5 text-gray-500 hover:text-gray-200 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            )}
            {searchParams.has('minRating') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-300 bg-gray-800/70 border border-gray-700/50 rounded-full">
                Rating: {searchParams.get('minRating')}+
                <button onClick={() => { setSearchParams((prev) => { prev.delete('minRating'); prev.set('page', '1'); return prev; }); }} className="ml-0.5 text-gray-500 hover:text-gray-200 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            )}
            {searchParams.get('featured') === 'true' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-300 bg-gray-800/70 border border-gray-700/50 rounded-full">
                Destacados
                <button onClick={() => { setSearchParams((prev) => { prev.delete('featured'); prev.set('page', '1'); return prev; }); }} className="ml-0.5 text-gray-500 hover:text-gray-200 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            )}
          </div>
        )}

        {/* ─── Productos ─── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} dark />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {data.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(page) =>
                setSearchParams((prev) => {
                  prev.set('page', String(page));
                  return prev;
                })
              }
              dark
            />
          </>
        ) : (
          <EmptyState
            title="No se encontraron productos"
            message="Intenta ajustar los filtros o realizar una nueva búsqueda."
            actionLabel="Ver todos los productos"
            onAction={() => setSearchParams({})}
            dark
          />
        )}
      </div>
    </div>
  );
}
