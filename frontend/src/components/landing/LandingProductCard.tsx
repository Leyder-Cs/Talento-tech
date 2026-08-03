import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { Button } from '../ui/Button';
import { StarRating } from '../ui/StarRating';
import { FavoriteButton } from '../ui/FavoriteButton';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { Modal } from '../ui/Modal';
import { generateProductMessage, openWhatsApp } from '../../utils/whatsapp';
import toast from 'react-hot-toast';

interface LandingProductCardProps {
  product: Product;
  simplified?: boolean;
}

export function LandingProductCard({ product, simplified = false }: LandingProductCardProps) {
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
        <div className="absolute top-3 right-3">
          <FavoriteButton
            productId={product.id}
            onAuthRequired={() => setShowLoginModal(true)}
            className="backdrop-blur-sm"
          />
        </div>
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
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1" variant="accent" onClick={handleAddToCart}>
              Añadir al carrito
            </Button>
            <button
              onClick={handleBuyNow}
              className="w-9 h-9 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="Comprar por WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} dark size="sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Inicia sesión</h3>
          <p className="text-sm text-gray-400 mb-5">Necesitás iniciar sesión para agregar productos al carrito.</p>
          <Button size="lg" className="w-full" onClick={() => { setShowLoginModal(false); navigate('/login'); }}>
            Iniciar sesión
          </Button>
        </div>
      </Modal>
    </Link>
  );
}
