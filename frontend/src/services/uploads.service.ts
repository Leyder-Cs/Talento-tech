import api from './axios.config';
import type { ProductImage } from '../types';

export const uploadsService = {
  uploadImages: (productId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api
      .post<ProductImage[]>(
        `/uploads/product/${productId}/images`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      .then((r) => r.data);
  },

  deleteImage: (imageId: string) =>
    api.delete(`/uploads/images/${imageId}`).then((r) => r.data),

  setPrimary: (imageId: string) =>
    api
      .patch<ProductImage>(`/uploads/images/${imageId}/primary`)
      .then((r) => r.data),
};
