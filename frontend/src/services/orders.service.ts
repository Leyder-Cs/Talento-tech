import api from './axios.config';
import type { Order } from '../types';

export const ordersService = {
  create: (data: { items: { productId: string; quantity: number }[] }) =>
    api.post<Order>('/orders', data).then((r) => r.data),

  findMy: () =>
    api.get<Order[]>('/orders/my').then((r) => r.data),

  findAll: (page?: number, limit?: number, status?: string, paymentStatus?: string, returnStatus?: string) =>
    api
      .get<{ data: Order[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
        '/orders',
        { params: { page, limit, status, paymentStatus, returnStatus } },
      )
      .then((r) => r.data),

  updateStatus: (id: string, data: { status?: string; paymentStatus?: string; items?: { productId: string; quantity: number }[] }) =>
    api
      .patch<Order>(`/orders/${id}/status`, data)
      .then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/orders/${id}`).then((r) => r.data),

  updateReturn: (id: string, data: { returnStatus: string; returnReason?: string }) =>
    api.patch<Order>(`/orders/${id}/return`, data).then((r) => r.data),

  cancelAsUser: (id: string) =>
    api.patch<Order>(`/orders/${id}/cancel`).then((r) => r.data),

  requestReturn: (id: string, returnReason?: string) =>
    api.patch<Order>(`/orders/${id}/return-request`, { returnReason }).then((r) => r.data),
};
