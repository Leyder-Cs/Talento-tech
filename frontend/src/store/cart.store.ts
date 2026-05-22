import { create } from 'zustand';
import type { CartItem } from '../types';
import { cartService } from '../services/cart.service';
import { useAuthStore } from './auth.store';
import toast from 'react-hot-toast';

interface CartState {
  items: CartItem[];
  initCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],

  initCart: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    try {
      const items = await cartService.getCart();
      set({ items });
    } catch {
      // Silently fail — carrito vacío en memoria
    }
  },

  addItem: async (item: CartItem) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para agregar al carrito');
      return;
    }

    try {
      const productId = item.productId || item.id;
      await cartService.addItem(productId, item.quantity);
      const items = await cartService.getCart();
      set({ items });
    } catch {
      toast.error('Error al agregar al carrito');
    }
  },

  removeItem: async (id: string) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    try {
      await cartService.removeItem(id);
      set({ items: get().items.filter((i) => i.id !== id) });
    } catch {
      toast.error('Error al eliminar del carrito');
    }
  },

  updateQuantity: async (id: string, qty: number) => {
    if (qty < 1) return;

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    try {
      await cartService.updateQuantity(id, qty);
      set({
        items: get().items.map((i) =>
          i.id === id ? { ...i, quantity: qty } : i,
        ),
      });
    } catch {
      toast.error('Error al actualizar cantidad');
    }
  },

  clearCart: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    try {
      await cartService.clearCart();
      set({ items: [] });
    } catch {
      toast.error('Error al limpiar el carrito');
    }
  },

  getTotalItems: () =>
    get().items.reduce((acc, i) => acc + i.quantity, 0),

  getTotalPrice: () =>
    get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
}));
