import { useState } from 'react';
import { useCategoryTree } from '../../hooks/useCategories';

const SCROLLBAR =
  '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600';

interface CategoryTreeContentProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onClear: () => void;
  onClose?: () => void;
  variant?: 'accordion' | 'split';
}

const CATEGORY_ICONS: Record<string, string> = {
  Vitaminas: '💊',
  Suplementos: '💊',
  'Vitaminas y Suplementos': '💊',
  'Cuidado Personal': '🧴',
  'Cuidado de la Piel': '🧴',
  'Higiene Bucal': '🪥',
  Medicamentos: '💊',
  'Alivio del Dolor': '🩹',
  'Alergias y Antihistamínicos': '🤧',
  'Deporte y Bienestar': '🏋️',
  'Proteínas y Batidos': '🥤',
  'Equipamiento Fitness': '🧘',
  'Salud Digestiva': '🌿',
  'Probióticos y Enzimas': '🦠',
  'Fibra y Digestivos': '🌾',
  Multivitamínicos: '💊',
  'Suplementos Deportivos': '🏃',
};

function getIcon(name: string): string {
  return CATEGORY_ICONS[name] || '📦';
}

const PLACEHOLDER_COLORS = ['#0D9488', '#059669', '#0284C7', '#7C3AED', '#DB2777', '#D97706', '#DC2626', '#0891B2'];

function getPlaceholderImage(name: string, size = 56): string {
  const words = name.split(' ');
  const initials = words.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const colorIndex = name.length % PLACEHOLDER_COLORS.length;
  const bg = PLACEHOLDER_COLORS[colorIndex];
  const fontSize = size * 0.4;
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${size / 2}" fill="${bg}"/>
      <text x="${size / 2}" y="${size / 2 + fontSize * 0.35}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold">${initials}</text>
    </svg>`
  )}`;
}

function getCategorySrc(imageUrl: string | null | undefined, name: string, size?: number): string {
  if (!imageUrl) return getPlaceholderImage(name, size);
  // Si ya es una URL completa (data URI, http, o absoluta), usarla directo
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) return imageUrl;
  // Si es una ruta relativa de la API, concatenar con la base
  return `${import.meta.env.VITE_API_URL}${imageUrl}`;
}

export function CategoryTreeContent({
  selectedCategory,
  onSelectCategory,
  onClear,
  variant = 'accordion',
  onClose,
}: CategoryTreeContentProps) {
  const { data: tree, isLoading } = useCategoryTree();
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const toggleParent = (slug: string) => {
    setExpandedParent((prev) => (prev === slug ? null : slug));
  };

  /* ─── VARIANT: split (doble panel) ─── */
  if (variant === 'split') {
    const parents = tree || [];
    const [activeParentSlug, setActiveParentSlug] = useState<string>(
      () => parents[0]?.slug || '',
    );

    // Sync active parent when tree loads or when selectedCategory changes
    const activeParent = parents.find((p) => p.slug === activeParentSlug);
    const children = activeParent?.children || [];

    return (
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-20 text-gray-500 hover:text-emphasis transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* Body: dos paneles */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Panel izquierdo: padres ── */}
          <div className={`w-72 flex-shrink-0 overflow-y-auto border-r border-white/5 p-2 ${SCROLLBAR}`}>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 bg-white/5 rounded animate-pulse" />
                ))}
              </div>
            ) : parents.length > 0 ? (
              <div className="space-y-0.5">
                {parents.map((parent) => {
                  const isActive = activeParentSlug === parent.slug;
                  return (
                    <button
                      key={parent.id}
                      onClick={() => setActiveParentSlug(parent.slug)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                        isActive
                          ? 'bg-gray-600/20 text-gray-100 font-medium'
                          : 'text-gray-300 hover:text-emphasis hover:bg-white/5'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={getCategorySrc(parent.imageUrl, parent.name, 24)}
                          alt={parent.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getPlaceholderImage(parent.name, 24);
                          }}
                        />
                      </span>
                      <span className="truncate flex-1">{parent.name}</span>
                      {parent._count && parent._count.products > 0 && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {parent._count.products}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-xs px-2">Sin categorías</p>
            )}
          </div>

          {/* ── Panel derecho: subcategorías del padre activo ── */}
          <div className={`flex-1 overflow-y-auto p-2 ${SCROLLBAR}`}>
            {!activeParent ? (
              <p className="text-gray-500 text-sm px-2 mt-2">
                Seleccioná una categoría
              </p>
            ) : children.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 p-1">
                {/* Ver todo dentro de la categoría padre */}
                <button
                  onClick={() => onSelectCategory(activeParentSlug)}
                  className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl text-sm transition-colors ${
                    selectedCategory === activeParentSlug
                      ? 'bg-gray-600/20 text-gray-100 font-medium ring-1 ring-white/10'
                      : 'text-gray-400 hover:text-emphasis hover:bg-white/5'
                  }`}
                >
                  <span className="w-14 h-14 rounded-full flex-shrink-0 bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </span>
                  <span className="text-xs text-center leading-tight line-clamp-2 font-medium text-gray-100">
                    Ver todo
                  </span>
                  {(activeParent._count?.products ?? 0) > 0 && (
                    <span className="text-[10px] text-gray-500 -mt-1">
                      {activeParent._count?.products} prod.
                    </span>
                  )}
                </button>
                {children.map((child) => {
                  const isActive = selectedCategory === child.slug;
                  return (
                    <button
                      key={child.id}
                      onClick={() => onSelectCategory(child.slug)}
                      className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl text-sm transition-colors ${
                        isActive
                          ? 'bg-gray-600/20 text-gray-100 font-medium ring-1 ring-white/10'
                          : 'text-gray-400 hover:text-emphasis hover:bg-white/5'
                      }`}
                    >
                      <span className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden">
                        <img
                          src={getCategorySrc(child.imageUrl, child.name, 56)}
                          alt={child.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getPlaceholderImage(child.name, 56);
                          }}
                        />
                      </span>
                      <span className="text-xs text-center leading-tight line-clamp-2">
                        {child.name}
                      </span>
                      {child._count && child._count.products > 0 && (
                        <span className="text-[10px] text-gray-500 -mt-1">
                          {child._count.products} prod.
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm px-2 mt-2">
                Sin subcategorías
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── VARIANT: accordion (default) ─── */
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-white/5 flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Categorías
        </h3>
      </div>

      {/* Body scrollable */}
      <div className={`flex-1 overflow-y-auto p-2 ${SCROLLBAR}`}>
        {/* Todas las categorías */}
        <button
          onClick={onClear}
          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
            !selectedCategory
              ? 'text-emphasis font-medium'
              : 'text-gray-400 hover:text-emphasis hover:bg-white/5'
          }`}
        >
          Explorar por categoría
        </button>

        {isLoading ? (
          <div className="space-y-2 px-2 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : tree && tree.length > 0 ? (
          <div className="mt-1">
            {tree.map((parent) => {
              const isExpanded = expandedParent === parent.slug;
              const hasChildren = parent.children && parent.children.length > 0;

              return (
                <div key={parent.id}>
                  {/* Parent */}
                  <button
                    onClick={() =>
                      hasChildren
                        ? toggleParent(parent.slug)
                        : onSelectCategory(parent.slug)
                    }
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isExpanded
                        ? 'bg-white/5 text-emphasis'
                        : 'text-gray-300 hover:text-emphasis hover:bg-white/5'
                    }`}
                  >
                    <span className="w-4 flex-shrink-0 flex justify-center">
                      {hasChildren && (
                        <svg
                          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </span>
                    <span className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={getCategorySrc(parent.imageUrl, parent.name, 24)}
                        alt={parent.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getPlaceholderImage(parent.name, 24);
                        }}
                      />
                    </span>
                    <span className="truncate flex-1">{parent.name}</span>
                    {parent._count && parent._count.products > 0 && (
                      <span className="text-xs text-gray-500">{parent._count.products}</span>
                    )}
                  </button>

                  {/* Children */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="ml-4 border-l border-white/10 pl-2 pb-1">
                      {parent.children!.map((child) => {
                        const isActive = selectedCategory === child.slug;
                        return (
                          <button
                            key={child.id}
                            onClick={() => onSelectCategory(child.slug)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-gray-600/20 text-gray-100 font-medium'
                                : 'text-gray-400 hover:text-emphasis hover:bg-white/5'
                            }`}
                          >
                            <span className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                              <img
                                src={getCategorySrc(child.imageUrl, child.name, 24)}
                                alt={child.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = getPlaceholderImage(child.name, 24);
                                }}
                              />
                            </span>
                            <span className="truncate flex-1">{child.name}</span>
                            {child._count && child._count.products > 0 && (
                              <span className="text-xs text-gray-500">{child._count.products}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm px-2 mt-2">No hay categorías</p>
        )}
      </div>
    </div>
  );
}
