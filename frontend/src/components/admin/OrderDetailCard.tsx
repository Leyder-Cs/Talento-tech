import { useState, useEffect } from 'react';
import { useUpdateOrderStatus, useDeleteOrder, useUpdateOrderReturn } from '../../hooks/useOrders';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import toast from 'react-hot-toast';
import type { Order, Product, Category } from '../../types';

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

const RETURN_LABELS: Record<string, string> = {
  NONE: 'Sin devolución',
  REQUESTED: 'Devolución solicitada',
  APPROVED: 'Devolución aprobada',
  REJECTED: 'Devolución rechazada',
  REFUNDED: 'Reembolsado',
};

const RETURN_VARIANTS: Record<string, 'warning' | 'info' | 'danger' | 'success'> = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  REFUNDED: 'success',
};

function returnBadge(returnStatus: string) {
  const v = RETURN_VARIANTS[returnStatus] || 'warning';
  const l = RETURN_LABELS[returnStatus] || returnStatus;
  if (returnStatus === 'NONE') return null;
  return <Badge variant={v}>{l}</Badge>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

function XIcon({ className }: { className?: string }) {
  return <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}

function DollarIcon({ className }: { className?: string }) {
  return <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function TruckIcon({ className }: { className?: string }) {
  return <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>;
}

function TrashIcon({ className }: { className?: string }) {
  return <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}

function PlusIcon({ className }: { className?: string }) {
  return <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}

interface OrderDetailCardProps {
  order: Order;
  onClose: () => void;
  variant?: 'orders' | 'returns';
}

export function OrderDetailCard({ order, onClose, variant = 'orders' }: OrderDetailCardProps) {
  const [adjustedQuantities, setAdjustedQuantities] = useState<Record<string, number>>({});
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newItems, setNewItems] = useState<{ productId: string; name: string; price: number; quantity: number }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [selectedCatSlug, setSelectedCatSlug] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [catProductsLoading, setCatProductsLoading] = useState(false);

  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const updateReturn = useUpdateOrderReturn();

  const isPending = order.status === 'PENDING';
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';
  const isConfirmed = order.status === 'CONFIRMED';
  const isShipping = order.status === 'SHIPPING';
  const isReturnsMode = variant === 'returns';

  const getAdjusted = (productId: string, original: number) => adjustedQuantities[productId] ?? original;

  const newItemsTotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const calcAdjustedTotal = () => {
    const existingTotal = order.items.reduce((sum, item) => {
      const qty = getAdjusted(item.productId, item.quantity);
      return sum + item.price * qty;
    }, 0);
    return existingTotal + newItemsTotal;
  };

  const hasAdjustments = () =>
    order.items.some(
      (item) => adjustedQuantities[item.productId] !== undefined && adjustedQuantities[item.productId] !== item.quantity,
    ) || newItems.length > 0;

  const adjustedTotal = isPending ? calcAdjustedTotal() : order.total;
  const hasAdj = isPending && hasAdjustments();
  const originalTotal = order.total;

  const setAdjusted = (productId: string, quantity: number) => {
    const clamped = Math.max(0, quantity);
    setAdjustedQuantities((prev) => ({ ...prev, [productId]: clamped }));
  };

  // ─── Cargar categorías al abrir modal ───
  useEffect(() => {
    if (showAddModal) {
      (async () => {
        try {
          const tree = await categoriesService.findTree();
          setCategories(tree);
        } catch {
          toast.error('Error al cargar categorías');
        }
      })();
    } else {
      setCategories([]);
      setExpandedCats(new Set());
      setSelectedCatSlug(null);
      setCategoryProducts([]);
    }
  }, [showAddModal]);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleSelectCategory = async (slug: string) => {
    setSelectedCatSlug(slug);
    setCatProductsLoading(true);
    try {
      const res = await productsService.findAll({ category: slug, limit: 50 });
      setCategoryProducts(res.data);
    } catch {
      toast.error('Error al cargar productos');
      setCategoryProducts([]);
    } finally {
      setCatProductsLoading(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    if (newItems.some((i) => i.productId === product.id)) {
      toast.error('Ya agregaste ese producto');
      return;
    }
    setNewItems((prev) => [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]);
    setShowAddModal(false);
    toast.success(`${product.name} agregado al pedido`);
  };

  const handleRemoveNewItem = (productId: string) => {
    setNewItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleConfirmAdjusted = () => {
    const existingItems = Object.entries(adjustedQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    const newProductItems = newItems.map((i) => ({ productId: i.productId, quantity: i.quantity }));

    // Si no hay ajustes ni productos nuevos, confirmar tal cual lo envió el cliente
    const allItems = existingItems.length || newProductItems.length
      ? [...existingItems, ...newProductItems]
      : order.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

    updateStatus.mutate(
      { id: order.id, status: 'CONFIRMED', items: allItems },
      { onSuccess: () => { toast.success('Pedido confirmado'); onClose(); }, onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al confirmar') },
    );
  };

  const handleConfirmAll = () => {
    const allItems = [
      ...order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      ...newItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    ];

    updateStatus.mutate(
      { id: order.id, status: 'CONFIRMED', items: allItems },
      { onSuccess: () => { toast.success('Pedido confirmado y stock descontado'); onClose(); }, onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al confirmar') },
    );
  };

  const handlePaymentToggle = () => {
    const newPayment = order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    updateStatus.mutate(
      { id: order.id, paymentStatus: newPayment },
      { onSuccess: () => toast.success(`Pago ${newPayment === 'PAID' ? 'registrado' : 'marcado como no pagado'}`), onError: () => toast.error('Error al actualizar pago') },
    );
  };

  const handleAdvanceStatus = (nextStatus: string) => {
    updateStatus.mutate(
      { id: order.id, status: nextStatus },
      { onSuccess: () => toast.success(`Pedido ${nextStatus === 'SHIPPING' ? 'enviado' : 'entregado'}`), onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al actualizar') },
    );
  };

  const handleCancel = () => {
    if (!cancelId) return;
    updateStatus.mutate(
      { id: order.id, status: 'CANCELLED' },
      { onSuccess: () => { toast.success('Pedido cancelado'); setCancelId(null); onClose(); }, onError: () => toast.error('Error al cancelar') },
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteOrder.mutate(order.id, {
      onSuccess: () => { toast.success('Pedido eliminado'); setDeleteId(null); onClose(); },
      onError: () => toast.error('Error al eliminar'),
    });
  };

  const handleApproveReturn = () => {
    updateReturn.mutate(
      { id: order.id, returnStatus: 'APPROVED' },
      { onSuccess: () => { toast.success('Devolución aprobada'); onClose(); }, onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al aprobar') },
    );
  };

  const handleRejectReturn = () => {
    updateReturn.mutate(
      { id: order.id, returnStatus: 'REJECTED' },
      { onSuccess: () => { toast.success('Devolución rechazada'); onClose(); }, onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al rechazar') },
    );
  };

  const handleRefundReturn = () => {
    updateReturn.mutate(
      { id: order.id, returnStatus: 'REFUNDED' },
      { onSuccess: () => { toast.success('Reembolso realizado'); onClose(); }, onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al reembolsar') },
    );
  };

  const renderCategoryNode = (
    cat: Category,
    expanded: Set<string>,
    onToggle: (id: string) => void,
    selected: string | null,
    onSelect: (slug: string) => void,
  ) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expanded.has(cat.id);
    const isSelected = selected === cat.slug;
    const prodCount = cat._count?.products ?? 0;

    return (
      <div key={cat.id}>
        <button
          onClick={() => (hasChildren ? onToggle(cat.id) : onSelect(cat.slug))}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
            isSelected
              ? 'bg-accent/10 text-accent'
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-gray-100'
          }`}
        >
          {hasChildren && (
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {!hasChildren && <span className="w-3" />}
          <span className="truncate flex-1">{cat.name}</span>
          {prodCount > 0 && !hasChildren && (
            <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full">{prodCount}</span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="ml-3 border-l border-gray-700/50 pl-2 mt-0.5 space-y-0.5">
            {cat.children!.map((child) =>
              renderCategoryNode(child, expanded, onToggle, selected, onSelect),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-emphasis">#{order.id.slice(0, 8)}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.user?.name || 'Usuario'} — {new Date(order.createdAt).toLocaleDateString('es-CO')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(order.status)}
          {isReturnsMode ? returnBadge(order.returnStatus) : paymentBadge(order.paymentStatus)}
          {!isReturnsMode && isPending && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors"
              title="Agregar producto"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium pb-2 border-b border-gray-800 mb-2">
            <span className="col-span-6">Producto</span>
            <span className="col-span-3 text-center">Cantidad</span>
            <span className="col-span-3 text-right">Subtotal</span>
          </div>
          {order.items.map((item) => {
            const originalQty = item.quantity;
            const currentQty = isPending ? getAdjusted(item.productId, originalQty) : originalQty;
            return (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm py-1.5">
                <span className="col-span-6 text-gray-300 truncate">{item.product?.name}</span>
                <div className="col-span-3 flex items-center justify-center">
                  {isPending && !isReturnsMode ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min={0}
                          value={currentQty}
                          onChange={(e) => setAdjusted(item.productId, parseInt(e.target.value) || 0)}
                          className="w-14 px-1.5 py-1 text-xs text-center border border-gray-700 bg-gray-800 text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <span className="text-xs text-gray-500">uds.</span>
                      </div>
                      <span className="text-[10px] text-gray-600">Orig: {originalQty}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">{currentQty}</span>
                  )}
                </div>
                <span className="col-span-3 text-right font-medium text-emphasis">
                  ${(item.price * currentQty).toLocaleString('es-CO')}
                </span>
              </div>
            );
          })}
          {!isReturnsMode && isPending && newItems.map((newItem) => (
            <div key={newItem.productId} className="grid grid-cols-12 gap-2 items-center text-sm py-1.5">
              <span className="col-span-6 text-accent truncate flex items-center gap-1.5">
                <PlusIcon className="w-3 h-3 text-accent" />
                {newItem.name}
              </span>
              <div className="col-span-3 flex items-center justify-center">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={0}
                      value={newItem.quantity}
                      onChange={(e) => {
                        const qty = Math.max(0, parseInt(e.target.value) || 0);
                        setNewItems((prev) => prev.map((i) => i.productId === newItem.productId ? { ...i, quantity: qty } : i));
                      }}
                      className="w-14 px-1.5 py-1 text-xs text-center border border-accent/50 bg-gray-800 text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-xs text-gray-500">uds.</span>
                  </div>
                </div>
              </div>
              <span className="col-span-3 text-right font-medium text-emphasis flex items-center justify-end gap-1">
                ${(newItem.price * newItem.quantity).toLocaleString('es-CO')}
                <button
                  onClick={() => handleRemoveNewItem(newItem.productId)}
                  className="p-0.5 hover:bg-red-500/10 rounded transition-colors"
                  title="Quitar"
                >
                  <XIcon className="w-3 h-3 text-red-400" />
                </button>
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Total:</span>
            <span className={`text-sm font-bold ${hasAdj ? 'text-gray-500 line-through' : 'text-emphasis'}`}>
              ${originalTotal.toLocaleString('es-CO')}
            </span>
            {hasAdj && (
              <span className="text-sm font-bold text-accent">
                ${adjustedTotal.toLocaleString('es-CO')}
              </span>
            )}
          </div>
        </div>

        {isReturnsMode ? (
          <div className="flex items-center gap-1.5 pt-2">
            {order.returnStatus === 'REQUESTED' && (
              <>
                <Button size="sm" variant="success" onClick={handleApproveReturn} loading={updateReturn.isPending}>
                  <CheckIcon className="w-3.5 h-3.5 mr-1" />
                  Aprobar devolución
                </Button>
                <Button size="sm" variant="danger" onClick={handleRejectReturn} loading={updateReturn.isPending}>
                  <XIcon className="w-3.5 h-3.5 mr-1" />
                  Rechazar devolución
                </Button>
              </>
            )}
            {order.returnStatus === 'APPROVED' && (
              <Button size="sm" variant="accent" onClick={handleRefundReturn} loading={updateReturn.isPending}>
                <DollarIcon className="w-3.5 h-3.5 mr-1" />
                Reembolsar
              </Button>
            )}
            {order.returnStatus === 'REJECTED' && (
              <p className="text-sm font-medium text-red-400">Devolución rechazada</p>
            )}
            {order.returnStatus === 'REFUNDED' && (
              <p className="text-sm font-medium text-green-400">Reembolsado</p>
            )}
          </div>
        ) : (<>
          {isPending && (
            <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="accent" onClick={handleConfirmAdjusted} loading={updateStatus.isPending}>
                  <CheckIcon className="w-3.5 h-3.5 mr-1" />
                  {hasAdj ? 'Ajustado' : 'Confirmar'}
                </Button>
                {hasAdj && (
                  <Button size="sm" variant="secondary" onClick={handleConfirmAll} loading={updateStatus.isPending}>
                    Todo
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="!text-red-400" onClick={() => setCancelId(order.id)}>
                  <XIcon className="w-3.5 h-3.5 mr-1" />
                  Cancelar
                </Button>
            </div>
          )}

          {(isConfirmed || isShipping) && (
            <div className="flex items-center gap-1.5 pt-2">
              {isConfirmed && (
                <Button size="sm" variant="info" onClick={() => handleAdvanceStatus('SHIPPING')} loading={updateStatus.isPending}>
                  <TruckIcon className="w-3.5 h-3.5 mr-1" />
                  Enviar
                </Button>
              )}
              {isShipping && (
                <Button size="sm" variant="success" onClick={() => handleAdvanceStatus('DELIVERED')} loading={updateStatus.isPending}>
                  <CheckIcon className="w-3.5 h-3.5 mr-1" />
                  Confirmar entrega
                </Button>
              )}
              <Button size="sm" variant={order.paymentStatus === 'PAID' ? 'secondary' : 'accent'} onClick={handlePaymentToggle} loading={updateStatus.isPending}>
                <DollarIcon className="w-3.5 h-3.5 mr-1" />
                {order.paymentStatus === 'PAID' ? 'Revertir' : 'Confirmar pago'}
              </Button>
              <Button size="sm" variant="ghost" className="!text-red-400" onClick={() => setCancelId(order.id)}>
                <XIcon className="w-3.5 h-3.5 mr-1" />
                Cancelar
              </Button>
            </div>
          )}

          {isDelivered && (
            <div className="flex items-center gap-1.5 pt-2">
              <Button size="sm" variant={order.paymentStatus === 'PAID' ? 'secondary' : 'accent'} onClick={handlePaymentToggle} loading={updateStatus.isPending}>
                <DollarIcon className="w-3.5 h-3.5 mr-1" />
                {order.paymentStatus === 'PAID' ? 'Revertir' : 'Confirmar pago'}
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteId(order.id)}>
                <TrashIcon className="w-3.5 h-3.5 mr-1" />
                Eliminar
              </Button>
            </div>
          )}

          {isCancelled && (
            <div className="flex items-center gap-1.5 pt-2">
              <p className="text-sm font-medium text-red-400">Pedido cancelado</p>
              <Button size="sm" variant="danger" onClick={() => setDeleteId(order.id)}>
                <TrashIcon className="w-3.5 h-3.5 mr-1" />
                Eliminar
              </Button>
            </div>
          )}
        </>)}

      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} dark size="lg">
        <div className="p-5 space-y-4 max-h-[80vh] flex flex-col">
          <h3 className="text-lg font-bold text-emphasis">Agregar producto al pedido</h3>
          <p className="text-xs text-gray-500">Seleccioná una categoría para ver sus productos.</p>

          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* ─── Categorías ─── */}
            <div className="w-1/3 overflow-y-auto border border-gray-700 rounded-lg bg-gray-800/30 p-2 space-y-0.5">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
              ) : (
                categories.map((cat) => renderCategoryNode(cat, expandedCats, toggleExpand, selectedCatSlug, handleSelectCategory))
              )}
            </div>

            {/* ─── Productos ─── */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {!selectedCatSlug ? (
                <p className="text-sm text-gray-500 text-center py-8">Seleccioná una categoría para ver sus productos</p>
              ) : catProductsLoading ? (
                <p className="text-sm text-gray-500 text-center py-8">Cargando productos...</p>
              ) : categoryProducts.length > 0 ? (
                categoryProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {(() => {
                        const imgUrl = p.images?.find((i) => i.isPrimary)?.imageUrl || p.images?.[0]?.imageUrl;
                        return imgUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                            <img
                              src={imgUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        ) : null;
                      })()}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">${p.price.toLocaleString('es-CO')} — Stock: {p.stock}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAddProduct(p)}>
                      <PlusIcon className="w-3.5 h-3.5 mr-1" />
                      Agregar
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No hay productos en esta categoría</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancelar pedido"
        message="¿Estás seguro de cancelar este pedido?"
        confirmText="Cancelar pedido"
        loading={updateStatus.isPending}
        dark
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar pedido"
        message="¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        loading={deleteOrder.isPending}
        dark
      />
    </div>
  );
}
