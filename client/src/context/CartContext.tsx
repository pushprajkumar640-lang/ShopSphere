import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '../lib/types';
import { clampQuantity, summarizeCart } from '../utils/cart';

const KEY = 'shopsphere_cart';

interface CartApi {
  items: CartItem[];
  summary: ReturnType<typeof summarizeCart>;
  add: (p: Product, qty?: number) => void;
  setQuantity: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const CartCtx = createContext<CartApi | null>(null);

function readCart(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage full or disabled */ }
  }, [items]);

  const add = useCallback((p: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) => (i.productId === p.id ? { ...i, stock: p.stock, quantity: clampQuantity(i.quantity + qty, p.stock) } : i));
      }
      return [...prev, { productId: p.id, name: p.name, image_url: p.image_url, unitPrice: p.final_price, quantity: clampQuantity(qty, p.stock), stock: p.stock }];
    });
  }, []);

  const setQuantity = useCallback((productId: number, qty: number) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: clampQuantity(qty, i.stock) } : i)));
  }, []);

  const remove = useCallback((productId: number) => setItems((prev) => prev.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, summary: summarizeCart(items), add, setQuantity, remove, clear }),
    [items, add, setQuantity, remove, clear],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
