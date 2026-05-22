import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '../services/favorites.service';
import { useAuthStore } from '../store/auth.store';

export function useFavorites() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesService.getAll(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFavoriteIds() {
  const { data: favorites } = useFavorites();

  if (!favorites) return new Set<string>();
  return new Set(favorites.map((f) => f.productId));
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      isFav,
    }: {
      productId: string;
      isFav: boolean;
    }) => (isFav ? favoritesService.remove(productId) : favoritesService.add(productId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
