import api from './axios.config';
import type { AuthResponse, User } from '../types';

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', { ...data, email: data.email.toLowerCase() }).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', { ...data, email: data.email.toLowerCase() }).then((r) => r.data),

  getProfile: () =>
    api
      .get<
        User & {
          reviews: unknown[];
          orders: unknown[];
        }
      >('/auth/profile')
      .then((r) => r.data),

  updateTheme: (theme: string) =>
    api.patch<{ id: string; theme: string }>('/auth/theme', { theme }).then((r) => r.data),

  updateProfile: (data: { name?: string; email?: string }) =>
    api.patch<User>('/auth/profile', data).then((r) => r.data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch<{ message: string }>('/auth/password', data).then((r) => r.data),
};
