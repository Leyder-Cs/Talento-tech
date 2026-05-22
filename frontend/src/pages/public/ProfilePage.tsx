import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useProfile, useUpdateTheme, useUpdateProfile, useUpdatePassword } from '../../hooks/useAuth';
import { useMyOrders, useCancelOrder, useRequestReturn } from '../../hooks/useOrders';
import { useFavorites, useToggleFavorite } from '../../hooks/useFavorites';
import { Badge } from '../../components/ui/Badge';
import { StarRating } from '../../components/ui/StarRating';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type TabType = 'profile' | 'orders' | 'reviews' | 'favorites';

interface ProfileReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  product: { id: string; name: string; slug: string };
}

const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'] as const;
const ORDER_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPING: 'En envío',
  DELIVERED: 'Entregado',
};

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const { user } = useAuthStore();
  const isLight = user?.theme === 'light';
  const { mutate: updateTheme, isPending: isUpdatingTheme } = useUpdateTheme();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutateAsync: changePassword, isPending: isChangingPassword } = useUpdatePassword();
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();
  const { mutate: requestReturn, isPending: isRequestingReturn } = useRequestReturn();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: orders, isLoading: ordersLoading } = useMyOrders();
  const { data: favorites, isLoading: favsLoading } = useFavorites();
  const toggleFav = useToggleFavorite();

  const reviews = (profile?.reviews as ProfileReview[]) || [];

  // ─── Edit profile state ───
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  // ─── Change password state ───
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');

  // ─── Cancel confirmation ───
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  // ─── Return request ───
  const [returnTarget, setReturnTarget] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  // ─── Stats ───
  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.filter((o) => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.total, 0) || 0;
  const totalReviews = reviews.length;

  const handleSaveProfile = () => {
    updateProfile(
      { name: editName, email: editEmail },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleChangePassword = async () => {
    if (pwNew !== pwConfirm) return;
    setPwError('');
    try {
      await changePassword({ currentPassword: pwCurrent, newPassword: pwNew });
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setPwError(axiosError?.response?.data?.message || 'Error al cambiar la contraseña');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId, {
      onSuccess: () => {
        toast.success('Pedido cancelado');
        setCancelTarget(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Error al cancelar el pedido');
      },
    });
  };

  const handleRequestReturn = () => {
    if (!returnTarget) return;
    requestReturn(
      { id: returnTarget, reason: returnReason || undefined },
      {
        onSuccess: () => {
          toast.success('Solicitud de devolución enviada');
          setReturnTarget(null);
          setReturnReason('');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al solicitar devolución');
        },
      },
    );
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'profile', label: 'Mi información' },
    { id: 'orders', label: 'Mis pedidos' },
    { id: 'reviews', label: 'Mis reseñas' },
    { id: 'favorites', label: 'Mis favoritos' },
  ];

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-emphasis">Mi Perfil</h1>
            <p className="text-sm text-gray-400 mt-0.5">Administra tu información personal</p>
          </div>
        </div>

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-4 gap-4 max-w-2xl">
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">{totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Pedidos</p>
          </div>
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">${totalSpent.toLocaleString('es-CO')}</p>
            <p className="text-xs text-gray-500 mt-1">Gastado</p>
          </div>
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">{totalReviews}</p>
            <p className="text-xs text-gray-500 mt-1">Reseñas</p>
          </div>
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">{favorites?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Favoritos</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════ TAB: MI INFORMACIÓN ══════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-lg">
            {/* ─── Avatar y datos ─── */}
            <div className="bg-gray-800/50 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-accent/20">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  {editing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="Nombre"
                      />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="Email"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={isUpdatingProfile}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
                        >
                          {isUpdatingProfile ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-emphasis">{user?.name}</h2>
                        <p className="text-gray-400 mt-0.5">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditName(user?.name || '');
                          setEditEmail(user?.email || '');
                          setEditing(true);
                        }}
                        className="text-xs text-gray-500 hover:text-accent transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Rol</span>
                  <Badge variant="info">{user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</Badge>
                </div>
                {profile && (
                  <div className="flex justify-between py-3">
                    <span className="text-gray-400">Miembro desde</span>
                    <span className="font-medium text-emphasis">
                      {new Date(profile.createdAt).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Cambiar contraseña ─── */}
            <div className="bg-gray-800/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Cambiar contraseña
              </h3>
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Contraseña actual"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <input
                  type="password"
                  placeholder="Confirmar nueva contraseña"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                {pwNew !== pwConfirm && pwConfirm && (
                  <p className="text-xs text-red-400">Las contraseñas no coinciden</p>
                )}
                {pwError && (
                  <p className="text-xs text-red-400">{pwError}</p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !pwCurrent || !pwNew || pwNew !== pwConfirm}
                  className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isChangingPassword ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </div>

            {/* ─── Configuración (tema) ─── */}
            <div className="bg-gray-800/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => updateTheme('dark')}
                  disabled={isUpdatingTheme}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    !isLight ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">Modo oscuro</p>
                    <p className="text-xs opacity-60">Fondo oscuro para el panel</p>
                  </div>
                  {!isLight && (
                    <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => updateTheme('light')}
                  disabled={isUpdatingTheme}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isLight ? 'bg-amber-500/10 text-amber-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">Modo claro</p>
                    <p className="text-xs opacity-60">Fondo claro para el panel</p>
                  </div>
                  {isLight && (
                    <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: MIS PEDIDOS ══════════════ */}
        {activeTab === 'orders' && (
          <div>
            {/* Mini stats por estado */}
            <div className="grid grid-cols-6 gap-2 mb-6">
              {(['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const).map((step) => {
                const count = step === 'REFUNDED'
                  ? orders?.filter((o) => o.returnStatus === 'REFUNDED').length || 0
                  : orders?.filter((o) => o.status === step).length || 0;
                const style: Record<string, string> = {
                  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  SHIPPING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
                  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
                  REFUNDED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                };
                const label: Record<string, string> = {
                  ...ORDER_LABELS,
                  CANCELLED: 'Cancelado',
                  REFUNDED: 'Reembolsado',
                };
                return (
                  <div key={step} className={`text-center p-3 rounded-xl border ${style[step] || ''}`}>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs opacity-70">{label[step]}</p>
                  </div>
                );
              })}
            </div>

            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-36 w-full !bg-gray-700 rounded-xl" />
                ))}
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  const currentIdx = Math.max(0, ORDER_STEPS.indexOf(order.status as typeof ORDER_STEPS[number]));
                  return (
                    <div key={order.id} className="bg-gray-800/50 border border-white/5 rounded-2xl p-6 hover:bg-gray-800/80 transition-colors">
                      {/* Cabecera */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : order.status === 'CONFIRMED' || order.status === 'SHIPPING' ? 'info' : 'warning'}>
                            {ORDER_LABELS[order.status]}
                          </Badge>
                          <span className="font-bold text-lg text-accent">${order.total.toLocaleString('es-CO')}</span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center gap-1 mb-4">
                        {ORDER_STEPS.map((step, idx) => (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx <= currentIdx
                                ? 'bg-accent text-white'
                                : 'bg-gray-700 text-gray-500'
                            }`}>
                              {idx < currentIdx ? '✓' : idx + 1}
                            </div>
                            {idx < ORDER_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${
                                idx < currentIdx ? 'bg-accent' : 'bg-gray-700'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-400">{item.product.name} <span className="text-gray-600">×</span> {item.quantity}</span>
                            <span className="font-medium text-emphasis">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                        {order.status === 'CANCELLED' ? (
                          <Badge variant="danger">Cancelado</Badge>
                        ) : (
                          <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                            {order.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente de pago'}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => setCancelTarget(order.id)}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              Cancelar pedido
                            </button>
                          )}
                          {order.status === 'DELIVERED' && order.returnStatus === 'NONE' && (
                            <button
                              onClick={() => { setReturnTarget(order.id); setReturnReason(''); }}
                              disabled={isRequestingReturn}
                              className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors"
                            >
                              Solicitar devolución
                            </button>
                          )}
                          {order.status === 'DELIVERED' && order.returnStatus !== 'NONE' && (
                            <Badge variant={
                              order.returnStatus === 'REQUESTED' ? 'warning' :
                              order.returnStatus === 'APPROVED' ? 'info' :
                              order.returnStatus === 'REFUNDED' ? 'success' : 'danger'
                            }>
                              {order.returnStatus === 'REQUESTED' ? 'Devolución solicitada' :
                               order.returnStatus === 'APPROVED' ? 'Devolución aprobada' :
                               order.returnStatus === 'REJECTED' ? 'Devolución rechazada' :
                               'Reembolsado'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No tenés pedidos aún"
                message="Explorá nuestro catálogo y hace tu primer pedido."
                actionLabel="Ver catálogo"
                onAction={() => navigate('/catalog')}
                dark
              />
            )}
          </div>
        )}

        {/* ══════════════ TAB: MIS RESEÑAS ══════════════ */}
        {activeTab === 'reviews' && (
          <div>
            {profileLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full !bg-gray-700 rounded-xl" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-800/50 border border-white/5 rounded-2xl p-5 hover:bg-gray-800/80 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Link to={`/catalog/${review.product.slug}`} className="font-medium text-accent hover:text-accent/80">{review.product.name}</Link>
                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('es-CO')}</span>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                    <p className="text-gray-400 mt-2 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No has escrito reseñas"
                message="Compra productos y compartí tu experiencia."
                actionLabel="Ir al catálogo"
                onAction={() => navigate('/catalog')}
                dark
              />
            )}
          </div>
        )}

        {/* ══════════════ TAB: MIS FAVORITOS ══════════════ */}
        {activeTab === 'favorites' && (
          <div>
            {favsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-56 w-full !bg-gray-700 rounded-xl" />
                ))}
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map((fav) => {
                  const primaryImage = fav.product.images?.find((img) => img.isPrimary) || fav.product.images?.[0];
                  const FALLBACK = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1f2937"/><text x="100" y="105" text-anchor="middle" fill="#0D9488" font-family="Arial,sans-serif" font-size="24" font-weight="bold">L-Health</text></svg>');
                  return (
                    <Link
                      key={fav.id}
                      to={`/catalog/${fav.product.slug}`}
                      className="group block bg-gray-800/50 border border-white/5 rounded-xl overflow-hidden hover:bg-gray-800/80 hover:border-accent/30 transition-all"
                    >
                      <div className="aspect-square bg-gray-800 overflow-hidden relative">
                        <img
                          src={primaryImage?.imageUrl || FALLBACK}
                          alt={fav.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFav.mutate({ productId: fav.productId, isFav: true });
                          }}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Eliminar de favoritos"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-emphasis line-clamp-1">{fav.product.name}</h3>
                        <p className="text-sm font-bold text-accent mt-1">${fav.product.price.toLocaleString('es-CO')}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No tenés favoritos aún"
                message="Agregá productos a tus favoritos desde el catálogo para tenerlos siempre a mano."
                actionLabel="Ir al catálogo"
                onAction={() => navigate('/catalog')}
                dark
              />
            )}
          </div>
        )}

        {/* ─── Cancel confirmation modal ─── */}
        <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancelar pedido" dark={!isLight}>
          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>
            ¿Estás seguro de que querés cancelar este pedido? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCancelTarget(null)}
              className={`px-4 py-2 text-sm ${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200'} transition-colors`}
            >
              Volver
            </button>
            <button
              onClick={() => cancelTarget && handleCancelOrder(cancelTarget)}
              disabled={isCancelling}
              className={`px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-50 transition-colors ${
                isLight
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
            >
              {isCancelling ? 'Cancelando...' : 'Sí, cancelar pedido'}
            </button>
          </div>
        </Modal>

        {/* ─── Return request modal ─── */}
        <Modal isOpen={!!returnTarget} onClose={() => setReturnTarget(null)} title="Solicitar devolución" dark={!isLight}>
          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-4`}>
            Contanos el motivo de la devolución (opcional):
          </p>
          <textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Ej: Producto llegó en mal estado..."
            rows={3}
            className={`w-full border rounded-lg px-3 py-2 text-sm resize-none mb-6 ${
              isLight
                ? 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-accent'
                : 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500'
            }`}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setReturnTarget(null)}
              className={`px-4 py-2 text-sm ${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200'} transition-colors`}
            >
              Volver
            </button>
            <button
              onClick={handleRequestReturn}
              disabled={isRequestingReturn}
              className={`px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-50 transition-colors ${
                isLight
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              {isRequestingReturn ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
