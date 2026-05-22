import type { AxiosError } from 'axios';

export const MAX_JSON_SIZE_MB = 2;
export const MAX_UPLOAD_SIZE_MB = 5;

export function getApiError(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;

  if (axiosError?.response) {
    const status = axiosError.response.status;
    if (status === 413) {
      return `El archivo supera el límite de ${MAX_JSON_SIZE_MB}MB`;
    }
    return axiosError.response.data?.message || `Error inesperado (${status})`;
  }

  // MulterError (por si no pasa por el response normal)
  const err = error as { code?: string; message?: string };
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return `La imagen no puede superar los ${MAX_UPLOAD_SIZE_MB}MB`;
  }

  return err?.message || 'Error inesperado';
}
