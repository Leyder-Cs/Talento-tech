import { useState } from 'react';
import { useCategoryTree } from '../../hooks/useCategories';
import type { Category } from '../../types';

const CATEGORY_ICONS: Record<string, string> = {
  Suplementos: '💊',
  Cosmética: '🧴',
  'Cuidado personal': '🧖',
  Infusiones: '🍵',
  Aceites: '🫒',
  Bienestar: '✨',
};

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] || '📦';
}

interface CategoryDrilldownProps {
  selectedSubcategory: string;
  onSelectSubcategory: (slug: string) => void;
  onClear: () => void;
}

export function CategoryDrilldown({
  selectedSubcategory,
  onSelectSubcategory,
  onClear,
}: CategoryDrilldownProps) {
  const { data: categories, isLoading } = useCategoryTree();
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);

  const parentCategories = categories?.filter((cat) => !cat.parentId) || [];

  const handleParentClick = (parent: Category) => {
    setSelectedParent(parent);
  };

  const handleBack = () => {
    setSelectedParent(null);
    onClear();
  };

  const handleSubcategoryClick = (sub: Category) => {
    onSelectSubcategory(sub.slug);
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4">
        <button
          onClick={handleBack}
          className="text-gray-400 hover:text-emphasis transition-colors"
        >
          Todas las categorías
        </button>
        {selectedParent && (
          <>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-emphasis font-medium">{selectedParent.name}</span>
          </>
        )}
      </nav>

      {/* Cards */}
      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-40 bg-base-dark/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center animate-pulse"
            >
              <div className="w-10 h-10 bg-white/10 rounded-full mx-auto mb-3" />
              <div className="h-4 bg-white/10 rounded w-20 mx-auto mb-2" />
              <div className="h-3 bg-white/10 rounded w-14 mx-auto" />
            </div>
          ))}
        </div>
      ) : selectedParent ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {selectedParent.children?.map((sub) => {
            const isActive = selectedSubcategory === sub.slug;
            return (
              <button
                key={sub.id}
                onClick={() => handleSubcategoryClick(sub)}
                className={`flex-shrink-0 w-40 backdrop-blur-xl border rounded-xl p-4 text-center transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-accent/20 border-accent'
                    : 'bg-base-dark/60 border-white/10 hover:bg-base-dark/70 hover:border-white/20'
                }`}
              >
                <span className="text-3xl block group-hover:scale-110 transition-transform duration-200">
                  {getCategoryIcon(sub.name)}
                </span>
                <p className="text-white font-medium text-sm mt-2">{sub.name}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {sub._count?.products ?? 0} productos
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {parentCategories.map((parent) => {
            const isActive = selectedSubcategory === parent.slug;
            return (
              <button
                key={parent.id}
                onClick={() => handleParentClick(parent)}
                className={`flex-shrink-0 w-40 backdrop-blur-xl border rounded-xl p-4 text-center transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-accent/20 border-accent'
                    : 'bg-base-dark/60 border-white/10 hover:bg-base-dark/70 hover:border-white/20'
                }`}
              >
                <span className="text-3xl block group-hover:scale-110 transition-transform duration-200">
                  {getCategoryIcon(parent.name)}
                </span>
                <p className="text-white font-medium text-sm mt-2">{parent.name}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {parent._count?.products ?? 0} productos
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
