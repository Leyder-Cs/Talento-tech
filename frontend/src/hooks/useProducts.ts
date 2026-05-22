import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';

interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  featured?: string;
  includeInactive?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: string;
  minRating?: number;
}

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsService.findAll(filters),
    placeholderData: (prev) => prev,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsService.findFeatured(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProduct(idOrSlug: string) {
  const isId = /^cmp[a-z0-9]+$/i.test(idOrSlug);
  return useQuery({
    queryKey: ['products', idOrSlug],
    queryFn: () =>
      isId
        ? productsService.findById(idOrSlug)
        : productsService.findBySlug(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      productsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useToggleProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
