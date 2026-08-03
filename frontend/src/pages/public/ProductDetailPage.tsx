import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '../../hooks/useProducts';
import { useProductReviews, useCreateReview } from '../../hooks/useReviews';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { useQueryClient } from '@tanstack/react-query';
import { FavoriteButton } from '../../components/ui/FavoriteButton';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StarRating } from '../../components/ui/StarRating';
import { Skeleton } from '../../components/ui/Skeleton';
import { generateProductMessage, openWhatsApp } from '../../utils/whatsapp';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getApiError } from '../../utils/error';

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Selecciona una calificación').max(5),
  comment: z
    .string()
    .min(10, 'Mínimo 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),
});

type ReviewForm = z.infer<typeof reviewSchema>;

const FALLBACK_IMG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#1f2937"/><text x="300" y="295" text-anchor="middle" fill="#0D9488" font-family="Arial,sans-serif" font-size="64" font-weight="bold">YARAK</text><text x="300" y="340" text-anchor="middle" fill="#6b7280" font-family="Arial,sans-serif" font-size="18">Producto</text></svg>');

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: reviews } = useProductReviews(product?.id || '');
  const queryClient = useQueryClient();
  const createReview = useCreateReview();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const watchRating = watch('rating');

  if (isLoading) {
    return (
      <div className="bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton variant="image" className="aspect-square rounded-2xl bg-gray-800" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 bg-gray-800" />
              <Skeleton className="h-4 w-1/4 bg-gray-800" />
              <Skeleton className="h-6 w-1/3 bg-gray-800" />
              <Skeleton className="h-24 w-full bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-100">Producto no encontrado</h2>
          <Link to="/catalog">
            <Button className="mt-4">Volver al catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ id: 'placeholder', imageUrl: '', isPrimary: true }];

  const addToCart = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageId: images[0]?.id || '',
      imageUrl: images[0]?.imageUrl || '',
      slug: product.slug,
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const onSubmitReview = (data: ReviewForm) => {
    createReview.mutate(
      { productId: product.id, ...data },
      {
        onSuccess: () => {
          toast.success('Reseña publicada correctamente');
          reset();
          queryClient.invalidateQueries({ queryKey: ['products', product.slug] });
        },
        onError: (err: unknown) => {
          toast.error(getApiError(err));
        },
      },
    );
  };

  const tabs = [
    { id: 'description', label: 'Descripción' },
    { id: 'benefits', label: 'Beneficios' },
    { id: 'ingredients', label: 'Ingredientes' },
    { id: 'usage', label: 'Modo de uso' },
    { id: 'contraindications', label: 'Contraindicaciones' },
  ];

  const tabContent: Record<string, string> = {
    description: product.description,
    benefits: product.benefits,
    ingredients: product.ingredients,
    usage: product.usageInstructions,
    contraindications: product.contraindications,
  };

  return (
    <>
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link to="/" className="text-gray-400 hover:text-gray-200 transition-colors">Inicio</Link>
          <span className="text-gray-600">/</span>
          <Link to="/catalog" className="text-gray-400 hover:text-gray-200 transition-colors">Catálogo</Link>
          <span className="text-gray-600">/</span>
          <Link to={`/catalog?category=${product.category.slug}`} className="text-gray-400 hover:text-gray-200 transition-colors">
            {product.category.name}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* ─── Images ─── */}
          <div>
            <div className="aspect-square bg-gray-800 rounded-2xl overflow-hidden mb-4 relative">
              {product.featured && (
                <div className="absolute z-10 bottom-3 left-3">
                  <svg className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
              <img
                src={images[selectedImage]?.imageUrl || FALLBACK_IMG}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMG;
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors bg-gray-800 ${
                      selectedImage === i ? 'border-gray-400' : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={img.imageUrl || FALLBACK_IMG}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Info ─── */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                  {product.category.name}
                </span>
                <h1 className="text-3xl font-bold text-gray-100 mt-4 mb-3">{product.name}</h1>
              </div>
              <FavoriteButton productId={product.id} size="md" className="mt-1 shrink-0" onAuthRequired={() => setShowLoginModal(true)} />
            </div>
            <p className="text-gray-400 mb-5 leading-relaxed">{product.shortDescription}</p>

            <div className="flex items-center gap-3 mb-5">
              <StarRating rating={product.averageRating} size="md" />
              <span className="text-sm text-gray-500">
                {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'Sin reseñas'}
                {product.reviewCount > 0 && ` (${product.reviewCount} reseñas)`}
              </span>
            </div>

            <div className="h-px bg-gray-800 mb-5" />

            <p className="text-4xl font-bold text-gray-100 mb-5">
              ${product.price.toLocaleString('es-CO')}
            </p>

            <div className="flex items-center gap-2 mb-6">
              <span className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
              <div className="flex self-center sm:self-auto items-center border border-gray-700 rounded-lg bg-gray-800/50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors rounded-l-lg"
                >
                  −
                </button>
                <span className="px-4 py-2.5 font-medium text-gray-100 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3.5 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors rounded-r-lg disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                className="w-full sm:flex-1"
                onClick={addToCart}
                disabled={product.stock === 0}
              >
                Agregar al carrito
              </Button>
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => openWhatsApp(generateProductMessage(product))}
            >
              Comprar por WhatsApp
            </Button>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="mb-12">
          <div className="flex overflow-x-auto gap-1 border-b border-gray-800 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-100 text-gray-100'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {tabContent[activeTab]}
            </p>
          </div>
        </div>

        {/* ─── Reviews ─── */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">Reseñas</h2>

          <div className="flex items-center gap-5 mb-8 p-6 bg-gray-800/50 border border-gray-800 rounded-2xl">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-100">
                {product.averageRating > 0 ? product.averageRating.toFixed(1) : '-'}
              </p>
              <StarRating rating={product.averageRating} size="sm" />
              <p className="text-sm text-gray-500 mt-1.5">{product.reviewCount} reseñas</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 text-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
                        {review.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-200">{review.user.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  <p className="text-gray-400 mt-2 leading-relaxed">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aún no hay reseñas para este producto.
              </p>
            )}
          </div>

          {isAuthenticated ? (
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Deja tu reseña</h3>
              <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Calificación
                  </label>
                  <StarRating
                    rating={watchRating}
                    size="lg"
                    interactive
                    onChange={(val) => setValue('rating', val, { shouldValidate: true })}
                  />
                  {errors.rating && (
                    <p className="text-sm text-red-400 mt-1">{errors.rating.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Comentario
                  </label>
                  <textarea
                    {...register('comment')}
                    rows={4}
                    className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none placeholder-gray-600"
                    placeholder="Comparte tu experiencia con este producto..."
                  />
                  {errors.comment && (
                    <p className="text-sm text-red-400 mt-1">{errors.comment.message}</p>
                  )}
                </div>
                <Button type="submit" loading={createReview.isPending}>
                  Enviar reseña
                </Button>
              </form>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-800/30 border border-gray-800 rounded-2xl">
              <p className="text-gray-400 mb-3">Inicia sesión para dejar una reseña</p>
              <Link to="/login">
                <Button variant="secondary">Iniciar sesión</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>

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
