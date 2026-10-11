import { Link, useParams } from 'react-router-dom';
import { ErrorMessage, PageContainer, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { formatDate, formatINR } from '../utils/format';

export default function OrderConfirmationPage() {
  const { id = '' } = useParams();
  const { data: order, error, loading, retry } = useAsync(() => api.myOrder(id), [id]);

  if (loading) return <PageContainer><Spinner label="Loading your order" /></PageContainer>;
  if (error || !order) return <PageContainer><ErrorMessage message={error ?? 'Order not found'} onRetry={retry} /></PageContainer>;

  return (
    <PageContainer className="max-w-3xl">
      <div className="card p-8 text-center sm:p-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600" aria-hidden>✓</div>
        <h1 className="text-3xl font-extrabold text-navy-800">Order confirmed</h1>
        <p className="mt-2 text-slate-600">Thank you! This is a demo order. Your reference is <span className="font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</span>.</p>
        <p className="mt-1 text-sm text-slate-500">Placed on {formatDate(order.created_at)}</p>
      </div>

      <div className="card mt-6 p-6 sm:p-8">
        <h2 className="mb-4 font-bold text-navy-800">Items</h2>
        <ul className="divide-y divide-slate-100">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between py-3 text-sm">
              <span>{i.quantity} × {i.product_name ?? i.name}</span>
              <span className="font-medium">{formatINR(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shipping === 0 ? 'Free' : formatINR(order.shipping)}</dd></div>
          <div className="flex justify-between pt-2 text-base font-bold text-navy-900"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/account" className="btn-primary">View order history</Link>
        <Link to="/products" className="btn-ghost">Continue shopping</Link>
      </div>
    </PageContainer>
  );
}
