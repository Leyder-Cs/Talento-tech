import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { useCreateOrder } from '../../hooks/useOrders';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { QtyStepper } from '../ui/QtyStepper';
import { generateOrderMessage, openWhatsApp } from '../../utils/whatsapp';
import { getApiError } from '../../utils/error';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1f2937"/><text x="100" y="105" text-anchor="middle" fill="#0D9488" font-family="Arial,sans-serif" font-size="32" font-weight="bold">YARAK</text></svg>',
  );

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();
  const createOrder = useCreateOrder();
  const total = getTotalPrice();
  const itemCount = items.length;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para hacer un pedido');
      return;
    }

    const orderItems = items.map((item) => ({
      productId: item.productId || item.id,
      quantity: item.quantity,
    }));

    createOrder.mutate(
      { items: orderItems },
      {
        onSuccess: async () => {
          const url = generateOrderMessage(items);
          openWhatsApp(url);
          await clearCart();
          onClose();
          toast.success('Pedido registrado correctamente');
        },
        onError: (err: unknown) => {
          toast.error(getApiError(err));
        },
      },
    );
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Mi Carrito">
      {itemCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <svg
            className="w-16 h-16 text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
          <p className="text-gray-400 mb-2">Tu carrito está vacío</p>
          <p className="text-gray-500 text-sm mb-6">
            Agrega productos desde nuestro catálogo para empezar tu pedido.
          </p>
          <Link
            to="/catalog"
            onClick={onClose}
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            ← Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <p className="text-sm text-gray-500">
              {itemCount} producto{itemCount !== 1 ? 's' : ''}
            </p>
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3"
              >
                <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={
                      item.imageId
                        ? `${import.meta.env.VITE_API_URL}/uploads/product-image/${item.imageId}`
                        : item.imageUrl?.startsWith('data:')
                          ? item.imageUrl
                          : FALLBACK_IMG
                    }
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/catalog/${item.slug}`}
                    onClick={onClose}
                    className="font-medium text-white hover:text-accent transition-colors text-sm line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ${item.price.toLocaleString('es-CO')} c/u
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <QtyStepper
                      value={item.quantity}
                      onChange={(qty) => updateQuantity(item.id, qty)}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-accent">
                        ${(item.price * item.quantity).toLocaleString('es-CO')}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-5 py-4 space-y-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Subtotal</span>
              <span className="font-bold text-white text-lg">
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="space-y-2">
              <Button
                size="lg"
                className="w-full !bg-green-600 hover:!bg-green-700 !border-0"
                onClick={handleCheckout}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Enviar pedido por WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
