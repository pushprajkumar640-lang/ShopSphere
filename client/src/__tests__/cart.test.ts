import { describe, expect, it } from 'vitest';
import { clampQuantity, summarizeCart, FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from '../utils/cart';
import { discountedPrice } from '../utils/format';
import { validateShipping } from '../utils/validation';

const item = (unitPrice: number, quantity: number) => ({ productId: 1, name: 'x', image_url: '', unitPrice, quantity, stock: 99 });

describe('cart calculations', () => {
  it('returns zero totals for an empty cart and charges no shipping', () => {
    expect(summarizeCart([])).toEqual({ subtotal: 0, shipping: 0, total: 0, itemCount: 0 });
  });

  it('adds flat shipping below the free-shipping threshold', () => {
    const s = summarizeCart([item(400, 2)]);
    expect(s.subtotal).toBe(800);
    expect(s.shipping).toBe(SHIPPING_FLAT);
    expect(s.total).toBe(800 + SHIPPING_FLAT);
  });

  it('waives shipping at or above the threshold', () => {
    const s = summarizeCart([item(FREE_SHIPPING_THRESHOLD / 2, 2)]);
    expect(s.shipping).toBe(0);
    expect(s.total).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it('sums multiple lines and item counts precisely (no float drift)', () => {
    const s = summarizeCart([item(0.1, 3), item(0.2, 1)]);
    expect(s.subtotal).toBe(0.5);
    expect(s.itemCount).toBe(4);
  });

  it('clamps quantity to stock and the per-line cap of 20', () => {
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(50, 10)).toBe(10);
    expect(clampQuantity(50, 100)).toBe(20);
  });
});

describe('pricing helpers', () => {
  it('applies percentage discounts to two decimals', () => {
    expect(discountedPrice(5999, 25)).toBe(4499.25);
    expect(discountedPrice(499, 20)).toBe(399.2);
  });
});

describe('checkout validation', () => {
  const valid = { fullName: 'Pushpraj', address: '12 MG Road, Pune', city: 'Pune', zip: '411001', phone: '+91 98765 43210' };

  it('accepts a complete shipping address', () => {
    expect(validateShipping(valid)).toEqual({});
  });

  it('reports each invalid field', () => {
    const errs = validateShipping({ fullName: ' ', address: 'abc', city: '', zip: '!', phone: '12' });
    expect(Object.keys(errs).sort()).toEqual(['address', 'city', 'fullName', 'phone', 'zip']);
  });
});
