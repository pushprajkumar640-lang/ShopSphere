import { Link } from 'react-router-dom';
import { EmptyState, ErrorMessage, PageContainer, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { formatDate, formatINR } from '../utils/format';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { data: orders, error, loading, retry } = useAsync(() => api.myOrders(), []);

  return (
    <PageContainer>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-800">My account</h1>
          <p className="text-slate-600">{user?.name} · {user?.email}</p>
        </div>
        <button className="btn-ghost self-start" onClick={logout}>Sign out</button>
      </div>

      <h2 className="mb-4 text-xl font-bold text-navy-800">Order history</h2>
      {loading ? <Spinner label="Loading orders" /> : error ? <ErrorMessage message={error} onRetry={retry} /> : !orders?.length ? (
        <EmptyState title="No orders yet" body="When you place an order, it will appear here." action={<Link to="/products" className="btn-primary">Browse products</Link>} />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link key={o.id} to={`/order-confirmation/${o.id}`} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm text-slate-500">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-slate-500">{formatDate(o.created_at)} · {o.items.length} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-navy-900">{formatINR(o.total)}</p>
                  <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-700">{o.status}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
