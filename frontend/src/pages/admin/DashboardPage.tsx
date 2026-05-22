import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useProducts } from '../../hooks/useProducts';
import { useAllOrders } from '../../hooks/useOrders';
import { useAllReviews } from '../../hooks/useReviews';
import { usersService } from '../../services/users.service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

const PIE_COLORS = ['#F59E0B', '#3B82F6', '#0D9488', '#10B981', '#EF4444'];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPING: 'En envío',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const BADGE_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  SHIPPING: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

function StatCard({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-white/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent">{icon}</span>
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-emphasis">{value}</p>
      {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function GradientIconCircle({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${gradient}`}>
      {children}
    </div>
  );
}

export function DashboardPage() {

  const { data: productsData } = useProducts({ limit: 1000, includeInactive: 'true' });
  const { data: ordersData, isLoading: ordersLoading } = useAllOrders(1, 1000);
  const { data: reviewsData } = useAllReviews();

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: () => usersService.findAll(1, 1),
  });

  const activeProducts = productsData?.data?.filter((p) => p.active)?.length || 0;
  const lowStock = productsData?.data?.filter((p) => p.stock < 5) || [];
  const totalUsers = usersData?.meta?.total || 0;

  const orders = ordersData?.data || [];
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const shippingOrders = orders.filter((o) => o.status === 'SHIPPING').length;
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED').length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
  const totalOrders = orders.length;
  const totalRevenue = orders.filter((o) => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0);
  const pendingReviews = reviewsData?.filter((r) => r.status === 'PENDING').length || 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const recentOrders = orders.slice(0, 6);
  const topProducts = productsData?.data?.filter((p) => p.active).slice(0, 5) || [];

  const areaData = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
      days[key] = 0;
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const now = new Date();
      const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 6) {
        const key = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
        if (days[key] !== undefined) days[key]++;
      }
    });
    return Object.entries(days).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const revenueData = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
      days[key] = 0;
    }
    orders.filter((o) => o.status === 'DELIVERED').forEach((o) => {
      const d = new Date(o.createdAt);
      const now = new Date();
      const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 6) {
        const key = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
        if (days[key] !== undefined) days[key] += o.total;
      }
    });
    return Object.entries(days).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const pieData = useMemo(() => {
    const items = [
      { name: 'Pendiente', value: pendingOrders },
      { name: 'Confirmado', value: confirmedOrders },
      { name: 'En envío', value: shippingOrders },
      { name: 'Entregado', value: deliveredOrders },
      { name: 'Cancelado', value: cancelledOrders },
    ];
    return items.filter((i) => i.value > 0);
  }, [pendingOrders, confirmedOrders, shippingOrders, deliveredOrders, cancelledOrders]);

  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID').length;
  const unpaidOrders = orders.filter((o) => o.paymentStatus === 'UNPAID').length;

  const paymentPieData = useMemo(() => {
    const items = [
      { name: 'Pagados', value: paidOrders },
      { name: 'No pagados', value: unpaidOrders },
    ];
    return items.filter((i) => i.value > 0);
  }, [paidOrders, unpaidOrders]);

  const PAYMENT_COLORS = ['#0D9488', '#EF4444'];

  const recentReviews = useMemo(() => {
    return (reviewsData || []).slice(0, 4);
  }, [reviewsData]);

  const stats = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Ventas totales',
      value: `$${totalRevenue.toLocaleString('es-CO')}`,
      subtitle: `$${avgOrderValue.toLocaleString('es-CO')} por pedido`,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      label: 'Pedidos totales',
      value: totalOrders,
      subtitle: `${pendingOrders} pendientes`,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      label: 'Productos activos',
      value: activeProducts,
      subtitle: `${lowStock.length} con stock bajo`,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      label: 'Usuarios',
      value: totalUsers,
      subtitle: 'Registrados',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-center">
        <div>
          <h1 className="text-base font-semibold text-emphasis">Dashboard</h1>
        </div>
        <div className="flex justify-end">
          <div className="relative w-full max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-800/80 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all text-gray-300 placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ icon, label, value, subtitle }) => (
          <StatCard key={label} icon={icon} label={label} value={value} subtitle={subtitle} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-gray-800/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GradientIconCircle gradient="bg-accent/10">
                  <TrendingUpIcon />
                </GradientIconCircle>
                <div>
                  <h2 className="text-sm font-semibold text-emphasis">Ingresos (7 días)</h2>
                  <p className="text-[11px] text-gray-500">Productos vendidos por día</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-emphasis">${revenueData.reduce((s, d) => s + d.value, 0).toLocaleString('es-CO')}</p>
                <p className="text-[11px] text-gray-500">Total semana</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1F2937', color: '#F9FAFB', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={2} fill="url(#revenueGradient)" dot={{ fill: '#0D9488', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <GradientIconCircle gradient="bg-amber-500/10">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </GradientIconCircle>
                <div>
                  <h2 className="text-sm font-semibold text-emphasis">Estado de pedidos</h2>
                  <p className="text-[11px] text-gray-500">{totalOrders} pedidos totales</p>
                </div>
              </div>
              {pieData.length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value">
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1F2937', color: '#F9FAFB', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No hay pedidos</p>
              )}
              <div className="space-y-1 pt-2 border-t border-gray-800 mt-2">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-gray-300">{item.name}</span>
                    </div>
                    <span className="font-medium text-emphasis">{item.value}</span>
                  </div>
                ))}
              </div>
              {pendingOrders > 0 && (
                <Link to="/admin/orders?status=PENDING">
                  <Button size="sm" className="w-full mt-2 !bg-accent text-white hover:!bg-accent/90 border-0 text-xs py-1.5">
                    Revisar pendientes ({pendingOrders})
                  </Button>
                </Link>
              )}
            </div>
            <div className="bg-gray-800/50 rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <GradientIconCircle gradient="bg-emerald-500/10">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </GradientIconCircle>
                <div>
                  <h2 className="text-sm font-semibold text-emphasis">Estado de pago</h2>
                  <p className="text-[11px] text-gray-500">{paidOrders} pagados · {unpaidOrders} no pagados</p>
                </div>
              </div>
              {paymentPieData.length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value">
                        {paymentPieData.map((_, index) => (
                          <Cell key={`pay-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1F2937', color: '#F9FAFB', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">Sin datos de pago</p>
              )}
              <div className="space-y-1 pt-2 border-t border-gray-800 mt-2">
                {paymentPieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }} />
                      <span className="text-gray-300">{item.name}</span>
                    </div>
                    <span className="font-medium text-emphasis">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-800/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GradientIconCircle gradient="bg-accent/10">
                  <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </GradientIconCircle>
                <div>
                  <h2 className="text-sm font-semibold text-emphasis">Últimos pedidos</h2>
                  <p className="text-[11px] text-gray-500">Los pedidos más recientes</p>
                </div>
              </div>
              <Link to="/admin/orders" className="text-xs text-accent hover:text-accent/80 font-medium">
                Ver todos
              </Link>
            </div>
            {ordersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg !bg-gray-700" />
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Cliente</th>
                      <th className="text-left pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                      <th className="text-left pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Producto</th>
                      <th className="text-right pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                      <th className="text-center pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Estado</th>
                      <th className="text-center pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {recentOrders.map((order) => {
                      const firstItem = order.items?.[0];
                      return (
                        <tr key={order.id} className="text-xs hover:bg-gray-800/30 transition-colors">
                          <td className="py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-accent/10 text-accent rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                                {order.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span className="text-gray-300">{order.user?.name || 'Usuario'}</span>
                            </div>
                          </td>
                          <td className="py-2 text-gray-500 text-[11px] whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-2 text-gray-400 text-[11px] truncate max-w-[80px]">
                            {firstItem?.product?.name || '—'}
                          </td>
                          <td className="py-2 text-right font-semibold text-emphasis text-xs whitespace-nowrap">
                            ${order.total.toLocaleString('es-CO')}
                          </td>
                          <td className="py-2 text-center whitespace-nowrap">
                            <Badge variant={BADGE_VARIANT[order.status] || 'warning'} className="!text-[10px] !px-1.5 !py-0.5">
                              {STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-center whitespace-nowrap">
                            <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'danger'} className="!text-[10px] !px-1.5 !py-0.5">
                              {order.paymentStatus === 'PAID' ? 'Pagado' : 'No pagado'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No hay pedidos aún</p>
            )}
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <GradientIconCircle gradient="bg-purple-500/10">
                <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </GradientIconCircle>
              <div>
                <h2 className="text-sm font-semibold text-emphasis">Reseñas recientes</h2>
                <p className="text-[11px] text-gray-500">{pendingReviews} pendientes</p>
              </div>
            </div>
            {recentReviews.length > 0 ? (
              <div className="space-y-2">
                {recentReviews.map((review) => (
                  <div key={review.id} className="pb-2 border-b border-gray-800/60 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-300 flex-shrink-0">
                        {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-300">{review.user?.name || 'Usuario'}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'text-amber-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{review.comment || 'Sin comentario'}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">{new Date(review.createdAt).toLocaleDateString('es-CO')}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingReviews > 0 && (
                  <Link to="/admin/reviews" className="block text-xs text-accent hover:text-accent/80 font-medium text-center pt-1">
                    Ver todas ({pendingReviews})
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No hay reseñas aún</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <GradientIconCircle gradient="bg-red-500/10">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </GradientIconCircle>
                <div>
                  <h2 className="text-sm font-semibold text-emphasis">Stock bajo</h2>
                  <p className="text-[11px] text-gray-500">Productos con menos de 5 unidades</p>
                </div>
              </div>
              {lowStock.length > 0 ? (
                <div className="divide-y divide-gray-800/60">
                  {lowStock.slice(0, 4).map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 bg-gray-700 rounded overflow-hidden flex-shrink-0 ring-1 ring-gray-700">
                          {product.images?.[0] ? (
                            <img src={product.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">P</div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-300 truncate">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="w-12 bg-gray-700 rounded-full h-1">
                          <div className="bg-red-500 rounded-full h-1" style={{ width: `${Math.min(100, (product.stock / 5) * 100)}%` }} />
                        </div>
                        <Badge variant="danger" className="!text-[10px] !px-1.5 !py-0.5">{product.stock}</Badge>
                      </div>
                    </div>
                  ))}
                  {lowStock.length > 4 && (
                    <Link to="/admin/products" className="block text-xs text-accent hover:text-accent/80 font-medium text-center pt-2">
                      Ver todos ({lowStock.length})
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No hay productos con stock bajo</p>
              )}
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <GradientIconCircle gradient="bg-blue-500/10">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </GradientIconCircle>
                <div>
                  <h2 className="text-sm font-semibold text-emphasis">Pedidos pendientes</h2>
                  <p className="text-[11px] text-gray-500">Requieren atención</p>
                </div>
              </div>
              {orders.filter((o) => o.status === 'PENDING').length > 0 ? (
                <div className="space-y-1">
                  {orders.filter((o) => o.status === 'PENDING').slice(0, 4).map((order) => (
                    <Link key={order.id} to={`/admin/orders`} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                          {order.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-300 truncate">{order.user?.name || 'Usuario'}</p>
                          <p className="text-[11px] text-gray-500">${order.total.toLocaleString('es-CO')} — {new Date(order.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                      <Badge variant="warning" className="!text-[10px] !px-1.5 !py-0.5">Pendiente</Badge>
                    </Link>
                  ))}
                  <Link to="/admin/orders?status=PENDING">
                    <Button size="sm" className="w-full mt-2 !bg-accent text-white hover:!bg-accent/90 border-0 text-xs py-1.5">
                      Gestionar pendientes
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No hay pedidos pendientes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
