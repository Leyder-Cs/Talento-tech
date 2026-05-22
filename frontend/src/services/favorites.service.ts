import api from './axios.config';
import type { Product } from '../types';

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export const favoritesService = {
  getAll: () => api.get<Favorite[]>('/favorites').then((r) => r.data),

  add: (productId: string) =>
    api.post(`/favorites/${productId}`).then((r) => r.data),

  remove: (productId: string) =>
    api.delete(`/favorites/${productId}`).then((r) => r.data),
};
