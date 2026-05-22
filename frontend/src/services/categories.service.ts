import api from './axios.config';
import type { Category } from '../types';

export const categoriesService = {
  findAll: () =>
    api.get<Category[]>('/categories').then((r) => r.data),

  findTree: () =>
    api.get<Category[]>('/categories/tree').then((r) => r.data),

  create: (data: { name: string; imageUrl: string; parentId?: string }) =>
    api.post<Category>('/categories', data).then((r) => r.data),

  update: (id: string, data: { name: string; imageUrl: string; parentId?: string }) =>
    api.put<Category>(`/categories/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/categories/${id}`).then((r) => r.data),
};
