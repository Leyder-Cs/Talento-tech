import { useState } from 'react';
import {
  useAllReviews,
  useUpdateReviewStatus,
  useDeleteReview,
} from '../../hooks/useReviews';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StarRating } from '../../components/ui/StarRating';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: reviews, isLoading } = useAllReviews();
  const updateStatus = useUpdateReviewStatus();
  const deleteReview = useDeleteReview();

  const filtered = reviews
    ? statusFilter
      ? reviews.filter((r) => r.status === statusFilter)
      : reviews
    : [];

  const handleStatus = (id: string, status: string) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success('Estado actualizado'),
        onError: () => toast.error('Error al actualizar'),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteReview.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Reseña eliminada');
        setDeleteId(null);
      },
      onError: () => toast.error('Error al eliminar'),
    });
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'success' | 'danger'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      HIDDEN: 'danger',
    };
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      HIDDEN: 'Oculta',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emphasis">Reseñas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Modera las opiniones de tus clientes</p>
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-gray-800 text-gray-300 min-w-[140px]"
        >
          <option value="">Todas</option>
          <option value="PENDING">Pendientes</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="HIDDEN">Ocultas</option>
        </select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" dark />
      ) : filtered.length > 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Calificación</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comentario</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-pink-500/10 text-pink-400 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-gray-300">{review.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{review.product?.name}</td>
                    <td className="px-4 py-3 text-center">
                      <StarRating rating={review.rating} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                      {review.comment}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(review.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {review.status !== 'APPROVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatus(review.id, 'APPROVED')}
                          >
                            Aprobar
                          </Button>
                        )}
                        {review.status !== 'HIDDEN' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatus(review.id, 'HIDDEN')}
                          >
                            Ocultar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!text-red-400"
                          onClick={() => setDeleteId(review.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No hay reseñas"
          message={statusFilter ? 'No hay reseñas con ese filtro' : 'Aún no hay reseñas de clientes.'}
          dark
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar reseña"
        message="¿Estás seguro de eliminar esta reseña?"
        confirmText="Eliminar"
        loading={deleteReview.isPending}
        dark
      />
    </div>
  );
}
