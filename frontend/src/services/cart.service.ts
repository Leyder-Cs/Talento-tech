import api from './axios.config';
import type { CartItem } from '../types';

export const cartService = {
  getCart: () => api.get<CartItem[]>('/cart').then((r) => r.data),

  addItem: (productId: string, quantity: number) =>
    api.post('/cart/items', { productId, quantity }).then((r) => r.data),

  updateQuantity: (id: string, quantity: number) =>
    api.patch(`/cart/items/${id}`, { quantity }).then((r) => r.data),

  removeItem: (id: string) =>
    api.delete(`/cart/items/${id}`).then((r) => r.data),

  clearCart: () => api.delete('/cart').then((r) => r.data),
};
