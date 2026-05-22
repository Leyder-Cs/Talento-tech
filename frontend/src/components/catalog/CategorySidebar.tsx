import { useState } from 'react';
import { useCategoryTree } from '../../hooks/useCategories';

interface CategorySidebarProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
  showDesktop?: boolean;
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

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  onClear,
  isOpen,
  onToggle,
  showDesktop = true,
}: CategorySidebarProps) {
  const { data: tree, isLoading } = useCategoryTree();
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const toggleParent = (slug: string) => {
    setExpandedParent((prev) => (prev === slug ? null : slug));
  };

  const sidebarContent = (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Categorías
        </h3>
      </div>

      {/* Todas las categorías */}
      <button
        onClick={onClear}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
          !selectedCategory
            ? 'bg-accent/20 text-accent font-medium'
            : 'text-gray-400 hover:text-emphasis hover:bg-white/5'
        }`}
      >
        Todas las categorías
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
                {/* Parent category button */}
                <button
                  onClick={() =>
                    hasChildren
                      ? toggleParent(parent.slug)
                      : onSelectCategory(parent.slug)
                  }
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isExpanded
                      ? 'bg-white/5 text-emphasis'
                      : 'text-gray-300 hover:text-emphasis hover:bg-white/5'
                  }`}
                >
                  {/* Chevron */}
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </span>
                  {/* Icon */}
                  <span className="text-base flex-shrink-0">
                    {getIcon(parent.name)}
                  </span>
                  {/* Name */}
                  <span className="truncate flex-1">{parent.name}</span>
                  {/* Count */}
                  {parent._count && parent._count.products > 0 && (
                    <span className="text-xs text-gray-500">
                      {parent._count.products}
                    </span>
                  )}
                </button>

                {/* Children (with slide animation) */}
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
                              ? 'bg-accent/20 text-accent font-medium'
                              : 'text-gray-400 hover:text-emphasis hover:bg-white/5'
                          }`}
                        >
                          {/* Child image or icon */}
                          <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {child.imageUrl ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}${child.imageUrl}`}
                                alt={child.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">{getIcon(child.name)}</span>
                            )}
                          </span>
                          <span className="truncate flex-1">{child.name}</span>
                          {child._count && child._count.products > 0 && (
                            <span className="text-xs text-gray-500">
                              {child._count.products}
                            </span>
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
  );

  return (
    <>
      {/* Desktop sidebar */}
      {showDesktop && (
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="bg-gray-800/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 sticky top-24">
            {sidebarContent}
          </div>
        </aside>
      )}

      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-full shadow-lg hover:bg-accent/90 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
        Categorías
      </button>

      {/* Mobile overlay drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onToggle} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-gray-900 border-r border-white/5 shadow-xl p-5 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-emphasis uppercase tracking-wider">
                Categorías
              </h3>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-emphasis transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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
