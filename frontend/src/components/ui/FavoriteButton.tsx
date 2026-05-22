import { useAuthStore } from '../../store/auth.store';
import { useFavoriteIds, useToggleFavorite } from '../../hooks/useFavorites';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  productId: string;
  onAuthRequired?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function FavoriteButton({
  productId,
  onAuthRequired,
  className = '',
  size = 'sm',
}: FavoriteButtonProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();

  const isFav = favIds.has(productId);
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    toggleFav.mutate(
      { productId, isFav },
      {
        onSuccess: () => {
          toast.success(isFav ? 'Eliminado de favoritos' : 'Agregado a favoritos');
        },
      },
    );
  };

  return (
    <button
      onClick={handleClick}
      className={`${btnSize} flex items-center justify-center rounded-lg transition-colors ${
        isFav
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
      } ${className}`}
      title={isFav ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
    >
      <svg
        className={iconSize}
        fill={isFav ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
