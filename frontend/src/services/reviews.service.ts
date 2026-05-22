import api from './axios.config';
import type { Review } from '../types';

export const reviewsService = {
  findByProduct: (productId: string) =>
    api
      .get<Review[]>(`/reviews/product/${productId}`)
      .then((r) => r.data),

  findAll: () =>
    api.get<Review[]>('/reviews').then((r) => r.data),

  create: (data: {
    productId: string;
    rating: number;
    comment: string;
  }) => api.post<Review>('/reviews', data).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api
      .patch<Review>(`/reviews/${id}/status`, { status })
      .then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/reviews/${id}`).then((r) => r.data),
};
