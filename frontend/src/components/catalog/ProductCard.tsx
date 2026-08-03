import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { StarRating } from '../ui/StarRating';
import { FavoriteButton } from '../ui/FavoriteButton';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { Modal } from '../ui/Modal';
import { generateProductMessage, openWhatsApp } from '../../utils/whatsapp';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  simplified?: boolean;
}

export function ProductCard({ product, simplified = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!useAuthStore.getState().isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageId: primaryImage?.id || '',
      imageUrl: primaryImage?.imageUrl || '',
      slug: product.slug,
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openWhatsApp(generateProductMessage(product));
  };

  const FALLBACK_SVG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f5f5f5"/><text x="200" y="195" text-anchor="middle" fill="#0D9488" font-family="Arial,sans-serif" font-size="48" font-weight="bold">YARAK</text><text x="200" y="230" text-anchor="middle" fill="#a3a3a3" font-family="Arial,sans-serif" font-size="14">Producto</text></svg>');

  const imageUrl = primaryImage?.imageUrl || FALLBACK_SVG;

  return (
    <>
    <Link
      to={`/catalog/${product.slug}`}
      className="group block bg-white rounded-xl border border-primary-200 overflow-hidden hover:border-primary-300 hover:scale-[1.02] transition-all duration-300"
      style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
    >
      <div className="relative">
        <div className="aspect-square bg-primary-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_SVG;
            }}
          />
        </div>
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-primary-50/90 backdrop-blur-sm border border-black/10 text-xs font-medium text-primary-500 rounded-full">
            {product.category?.name}
          </span>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton
            productId={product.id}
            onAuthRequired={() => setShowLoginModal(true)}
          />
        </div>
        {product.featured && (
          <div className="absolute bottom-2 left-2">
            <svg className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-primary-900 line-clamp-2 min-h-[3rem] text-sm leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={product.averageRating} size="sm" />
          <span className="text-xs text-gray-500">
            {product.averageRating > 0 ? product.averageRating.toFixed(1) : ''}
            {product.reviewCount > 0 ? ` (${product.reviewCount})` : ''}
          </span>
        </div>
        <p className="text-lg font-bold text-primary-900 mt-2">
          ${product.price.toLocaleString('es-CO')}
        </p>
        {!simplified && (
          <div className="flex gap-1.5 mt-3">
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border border-gray-700"
              title="Añadir al carrito"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </button>
            <button
              onClick={handleBuyNow}
              className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="Comprar por WhatsApp"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </Link>
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} dark size="sm">
        <div className="text-center py-2">
          <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">¿Ya tenés cuenta?</h3>
          <p className="text-sm text-gray-400 mb-6">Necesitás estar logueado para agregar productos al carrito.</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Registrarme
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Seguir viendo
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
