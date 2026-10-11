import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FieldError, PageContainer } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ApiError, api } from '../services/api';
import type { ShippingInfo } from '../lib/types';
import { formatINR } from '../utils/format';
import { isEmpty, validateShipping, type Errors } from '../utils/validation';

const EMPTY: ShippingInfo = { fullName: '', address: '', city: '', zip: '', phone: '' };

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, summary, clear } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<ShippingInfo>({ ...EMPTY, fullName: user?.name ?? '' });
  const [errors, setErrors] = useState<Errors<ShippingInfo>>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (items.length === 0) {
    return <PageContainer><p className="text-center">Your cart is empty. <Link className="text-brand underline" to="/products">Shop now</Link></p></PageContainer>;
  }

  const set = (k: keyof ShippingInfo) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    const v = validateShipping(form);
    setErrors(v);
    if (!isEmpty(v) || !acknowledged) {
      if (!acknowledged) setServerError('Please confirm that you understand this is a demo order.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.placeOrder(items.map((i) => ({ productId: i.productId, quantity: i.quantity })), form);
      clear();
      toast.show('Demo order placed successfully!');
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) setErrors((prev) => ({ ...prev, ...apiErr.fieldErrors }));
      setServerError(apiErr.message);
    } finally {
      setSubmitting(false);
    }
  }

  const input = (k: keyof ShippingInfo, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} className={`input ${errors[k] ? 'input-error' : ''}`} value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `${k}-err` : undefined} {...props} />
      <div id={`${k}-err`}><FieldError message={errors[k]} /></div>
    </div>
  );

  return (
    <PageContainer>
      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <strong>Demo mode:</strong> This checkout does not process real payments and does not collect card details. Orders are saved for demonstration only.
      </div>
      <h1 className="mb-6 text-3xl font-extrabold text-navy-800">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8" aria-label="Shipping details">
          <h2 className="text-lg font-bold text-navy-800">Shipping details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {input('fullName', 'Full name', { autoComplete: 'name' })}
            {input('phone', 'Phone number', { type: 'tel', autoComplete: 'tel', placeholder: '+91 98765 43210' })}
          </div>
          {input('address', 'Address', { autoComplete: 'street-address', placeholder: 'House no., street, area' })}
          <div className="grid gap-5 sm:grid-cols-2">
            {input('city', 'City', { autoComplete: 'address-level2' })}
            {input('zip', 'Postal code', { autoComplete: 'postal-code' })}
          </div>

          <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm">
            <input type="checkbox" className="mt-1" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            <span>I understand this is a <strong>demo order</strong>. No payment will be charged.</span>
          </label>

          {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
            {submitting ? 'Placing order…' : `Place demo order · ${formatINR(summary.total)}`}
          </button>
        </form>

        <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-24">
          <h2 className="font-bold text-navy-800">Your items</h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3"><span className="truncate">{i.quantity} × {i.name}</span><span>{formatINR(i.unitPrice * i.quantity)}</span></li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(summary.subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{summary.shipping === 0 ? 'Free' : formatINR(summary.shipping)}</span></div>
            <div className="flex justify-between pt-1 text-base font-bold text-navy-900"><span>Total</span><span>{formatINR(summary.total)}</span></div>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
