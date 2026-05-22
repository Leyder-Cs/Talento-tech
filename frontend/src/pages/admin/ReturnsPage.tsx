import { useState } from 'react';
import { useAllOrders } from '../../hooks/useOrders';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { OrderDetailCard } from '../../components/admin/OrderDetailCard';
import { EmptyState } from '../../components/ui/EmptyState';

const RETURN_LABELS: Record<string, string> = {
  REQUESTED: 'Solicitada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  REFUNDED: 'Reembolsada',
};

const RETURN_VARIANTS: Record<string, 'warning' | 'info' | 'danger' | 'success'> = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  REFUNDED: 'success',
};

function returnBadge(status: string) {
  const variant = RETURN_VARIANTS[status] || 'warning';
  const label = RETURN_LABELS[status] || status;
  return <Badge variant={variant}>{label}</Badge>;
}

export function ReturnsPage() {
  const [page, setPage] = useState(1);
  const [returnFilter, setReturnFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filterValue = returnFilter || 'ANY';
  const { data, isLoading } = useAllOrders(page, 10, undefined, undefined, filterValue);

  const orders = data?.data || [];
  const first = orders[0] || null;
  const selectedOrder = selectedId ? orders.find((o) => o.id === selectedId) || first : first;

  const cardClass = (isActive: boolean) =>
    'rounded-xl border overflow-hidden transition-colors cursor-pointer ' +
    (isActive ? 'bg-gray-800 border-accent' : 'bg-gray-800/50 border-gray-800 hover:border-gray-700');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emphasis">Devoluciones</h1>
            <p className="text-sm text-gray-400">Gestiona las solicitudes de devolución</p>
          </div>
        </div>
        <select
          value={returnFilter}
          onChange={(e) => {
            setReturnFilter(e.target.value);
            setPage(1);
            setSelectedId(null);
          }}
          className="px-4 py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-gray-800 text-gray-300"
        >
          <option value="">Todas</option>
          <option value="REQUESTED">Solicitadas</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
          <option value="REFUNDED">Reembolsadas</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          {isLoading ? (
            <Skeleton className="h-64 w-full" dark />
          ) : orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => {
                const isActive = order.id === selectedOrder?.id;
                return (
                  <div
                    key={order.id}
                    className={cardClass(isActive)}
                    onClick={() => setSelectedId(order.id)}
                  >
                    <div className="px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-mono text-gray-500 flex-shrink-0 bg-gray-800 px-2 py-1 rounded-md">#{order.id.slice(0, 6)}</span>
                        <span className="text-sm font-medium text-gray-300 truncate">{order.user?.name || 'Usuario'}</span>
                        <span className="text-xs text-gray-500 hidden sm:block">
                          {new Date(order.createdAt).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-emphasis">
                          ${order.total.toLocaleString('es-CO')}
                        </span>
                        <div className="hidden sm:block">
                          {returnBadge(order.returnStatus)}
                        </div>
                      </div>
                    </div>
                    <div className="sm:hidden px-5 pb-3">
                      {returnBadge(order.returnStatus)}
                    </div>
                  </div>
                );
              })}
              {data?.meta && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-gray-500">
                    {data.meta.total} devolución{data.meta.total !== 1 ? 'es' : ''}
                  </p>
                  <Pagination
                    page={data.meta.page}
                    totalPages={data.meta.totalPages}
                    onPageChange={setPage}
                    dark
                  />
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No hay devoluciones"
              message="Las solicitudes de devolución aparecerán aquí cuando los clientes las soliciten."
              dark
            />
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden lg:sticky lg:top-4">
              <OrderDetailCard key={selectedOrder.id} order={selectedOrder} onClose={() => {}} variant="returns" />
            </div>
          ) : !isLoading && (
            <div className="bg-gray-800/50 rounded-xl border border-white/5 p-8 text-center text-gray-500">
              Seleccioná un pedido para gestionar su devolución
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
