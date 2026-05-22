import { useState } from 'react';
import { useAllOrders } from '../../hooks/useOrders';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { OrderDetailCard } from '../../components/admin/OrderDetailCard';

function statusBadge(status: string) {
  const map: Record<string, { variant: 'warning' | 'info' | 'success' | 'danger'; label: string }> = {
    PENDING: { variant: 'warning', label: 'Pendiente' },
    CONFIRMED: { variant: 'info', label: 'Confirmado' },
    SHIPPING: { variant: 'info', label: 'En envío' },
    DELIVERED: { variant: 'success', label: 'Entregado' },
    CANCELLED: { variant: 'danger', label: 'Cancelado' },
  };
  const s = map[status] || { variant: 'default' as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function paymentBadge(paymentStatus: string) {
  if (paymentStatus === 'PAID') {
    return <Badge variant="success">Pagado</Badge>;
  }
  return <Badge variant="warning">Pendiente de pago</Badge>;
}

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useAllOrders(page, 10, statusFilter || undefined);

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
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emphasis">Pedidos</h1>
            <p className="text-sm text-gray-400">Gestiona los pedidos de tus clientes</p>
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-gray-800 text-gray-300"
        >
          <option value="">Todos</option>
          <option value="PENDING">Pendientes</option>
          <option value="CONFIRMED">Confirmados</option>
          <option value="SHIPPING">En envío</option>
          <option value="DELIVERED">Entregados</option>
          <option value="CANCELLED">Cancelados</option>
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
                        <div className="hidden sm:flex items-center gap-1.5">
                          {statusBadge(order.status)}
                          {paymentBadge(order.paymentStatus)}
                        </div>
                      </div>
                    </div>
                    <div className="sm:hidden px-5 pb-3 flex items-center gap-1.5">
                      {statusBadge(order.status)}
                      {paymentBadge(order.paymentStatus)}
                    </div>
                  </div>
                );
              })}
              {data?.meta && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-gray-500">
                    {data.meta.total} pedido{data.meta.total !== 1 ? 's' : ''}
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
            <div className="text-center py-16 text-gray-400">
              No hay pedidos {statusFilter ? 'con ese estado' : 'aún'}.
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden lg:sticky lg:top-4">
              <OrderDetailCard key={selectedOrder.id} order={selectedOrder} onClose={() => {}} />
            </div>
          ) : !isLoading && (
            <div className="bg-gray-800/50 rounded-xl border border-white/5 p-8 text-center text-gray-500">
              Selecciona un pedido para ver el detalle
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
