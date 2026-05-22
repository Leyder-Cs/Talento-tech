import api from './axios.config';
import type { PaginatedResponse } from '../types';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  blocked: boolean;
  createdAt: string;
  _count: { orders: number; reviews: number };
}

export const usersService = {
  findAll: (page?: number, limit?: number) =>
    api
      .get<PaginatedResponse<AdminUser>>('/users', {
        params: { page, limit },
      })
      .then((r) => r.data),

  toggleBlock: (id: string) =>
    api.patch(`/users/${id}/block`).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};
