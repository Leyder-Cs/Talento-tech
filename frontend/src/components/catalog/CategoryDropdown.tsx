import { useState, useEffect, useRef } from 'react';
import { CategoryTreeContent } from './CategoryTreeContent';

interface CategoryDropdownProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function CategoryDropdown({
  selectedCategory,
  onSelectCategory,
  onClear,
  isOpen,
  onToggle,
  onClose,
}: CategoryDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSelect = (slug: string) => {
    onSelectCategory(slug);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          isOpen || selectedCategory
            ? 'bg-accent/20 text-accent border-accent/30'
            : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-emphasis hover:border-gray-600'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        Categorías
        {selectedCategory && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        )}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-gray-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <CategoryTreeContent
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelect}
            onClear={handleClear}
          />
        </div>
      )}
    </div>
  );
}
