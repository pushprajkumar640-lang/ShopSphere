import type { CartItem } from '../lib/types';

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FLAT = 49;

// Mirrors the server's calculation. The server is still the source of truth at checkout.
export function summarizeCart(items: CartItem[]) {
  const subtotal = Math.round(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = Math.round((subtotal + shipping) * 100) / 100;
  return { subtotal, shipping, total, itemCount };
}

export const clampQuantity = (qty: number, stock: number) => Math.max(1, Math.min(qty, stock, 20));
