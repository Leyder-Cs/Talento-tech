import type { CartItem, Product } from '../types';

export function generateOrderMessage(items: CartItem[]): string {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER;
  const itemList = items
    .map(
      (item, i) =>
        `${i + 1}. *${item.name}*\n   Cantidad: ${item.quantity}\n   Subtotal: $${(item.price * item.quantity).toLocaleString('es-CO')}`,
    )
    .join('\n\n');
  const total = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const message = `Hola, quisiera realizar el siguiente pedido:\n\n${itemList}\n\n*Total estimado: $${total.toLocaleString('es-CO')}*\n\n¿Confirmas disponibilidad y forma de envío?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function generateProductMessage(product: Product): string {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER;
  const message = `Hola, estoy interesado en:\n\n${product.name}\nPrecio: $${product.price.toLocaleString('es-CO')}\n\n¿Podrías darme más información sobre disponibilidad y envío?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
