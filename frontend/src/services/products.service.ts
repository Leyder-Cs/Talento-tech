import api from './axios.config';
import type {
  Product,
  PaginatedResponse,
} from '../types';

interface ProductQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  featured?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: string;
  minRating?: number;
}

export const productsService = {
  findAll: (params?: ProductQuery) =>
    api
      .get<PaginatedResponse<Product>>('/products', { params })
      .then((r) => r.data),

  findFeatured: () =>
    api.get<Product[]>('/products/featured').then((r) => r.data),

  findById: (id: string) =>
    api.get<Product>(`/products/id/${id}`).then((r) => r.data),

  findBySlug: (slug: string) =>
    api.get<Product>(`/products/${slug}`).then((r) => r.data),

  create: (data: unknown) =>
    api.post<Product>('/products', data).then((r) => r.data),

  update: (id: string, data: unknown) =>
    api.put<Product>(`/products/${id}`, data).then((r) => r.data),

  toggleActive: (id: string) =>
    api.patch<Product>(`/products/${id}/toggle`).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/products/${id}`).then((r) => r.data),
};
