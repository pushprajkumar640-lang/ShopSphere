import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, PageContainer } from '../components/ui';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';
import { FREE_SHIPPING_THRESHOLD } from '../utils/cart';

export default function CartPage() {
  const { items, summary, setQuantity, remove, clear } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <PageContainer>
        <EmptyState title="Your cart is empty" body="Looks like you have not added anything yet." action={<Link to="/products" className="btn-primary">Start shopping</Link>} />
      </PageContainer>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - summary.subtotal);

  return (
    <PageContainer>
      <h1 className="mb-6 text-3xl font-extrabold text-navy-800">Shopping cart <span className="text-lg font-medium text-slate-500">({summary.itemCount} items)</span></h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4" aria-label="Cart items">
          {items.map((item) => (
            <li key={item.productId} className="card flex gap-4 p-4 sm:gap-6 sm:p-5">
              <img src={item.image_url} alt="" className="h-24 w-24 shrink-0 rounded-xl bg-navy-50 object-cover sm:h-28 sm:w-28" />
              <div className="flex flex-1 flex-col justify-between gap-2">
                <div className="flex justify-between gap-4">
                  <Link to={`/products/${item.productId}`} className="font-semibold text-navy-800 hover:text-brand">{item.name}</Link>
                  <button onClick={() => remove(item.productId)} className="text-sm text-red-600 hover:underline" aria-label={`Remove ${item.name}`}>Remove</button>
                </div>
                <p className="text-sm text-slate-500">{formatINR(item.unitPrice)} each</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center overflow-hidden rounded-lg border border-slate-300">
                    <button className="px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40" disabled={item.quantity <= 1} onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span className="w-10 text-center font-medium" aria-live="polite">{item.quantity}</span>
                    <button className="px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40" disabled={item.quantity >= Math.min(item.stock, 20)} onClick={() => setQuantity(item.productId, item.quantity + 1)} aria-label="Increase quantity">+</button>
                  </div>
                  <p className="font-bold text-navy-900">{formatINR(item.unitPrice * item.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-navy-800">Order summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(summary.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{summary.shipping === 0 ? 'Free' : formatINR(summary.shipping)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-navy-900"><dt>Total</dt><dd>{formatINR(summary.total)}</dd></div>
          </dl>
          {remaining > 0 ? (
            <p className="rounded-lg bg-navy-50 p-3 text-sm text-navy-700">Add {formatINR(remaining)} more for free shipping.</p>
          ) : (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">🎉 You have unlocked free shipping!</p>
          )}
          <button className="btn-primary w-full py-3" onClick={() => navigate('/checkout')}>Proceed to checkout</button>
          <button className="btn-ghost w-full" onClick={() => { if (confirm('Remove all items from your cart?')) clear(); }}>Clear cart</button>
        </aside>
      </div>
    </PageContainer>
  );
}
