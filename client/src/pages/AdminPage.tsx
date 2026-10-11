import { useState, type ChangeEvent, type FormEvent } from 'react';
import { EmptyState, ErrorMessage, PageContainer, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { ApiError, api } from '../services/api';
import type { Category, Product } from '../lib/types';
import { formatDate, formatINR } from '../utils/format';

type Tab = 'overview' | 'products' | 'orders';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
  ];

  return (
    <PageContainer>
      <h1 className="mb-6 text-3xl font-extrabold text-navy-800">Admin dashboard</h1>
      <div role="tablist" className="mb-8 flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 font-medium transition ${tab === t.id ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'products' && <Products />}
      {tab === 'orders' && <Orders />}
    </PageContainer>
  );
}

function Overview() {
  const { data, error, loading, retry } = useAsync(() => api.admin.stats(), []);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorMessage message={error ?? 'Could not load stats'} onRetry={retry} />;
  const cards = [
    { label: 'Products', value: data.products },
    { label: 'Orders', value: data.orders },
    { label: 'Customers', value: data.customers },
    { label: 'Revenue (demo)', value: formatINR(data.revenue) },
    { label: 'Low stock (≤5)', value: data.low_stock },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="card p-5">
          <p className="text-sm text-slate-500">{c.label}</p>
          <p className="mt-2 text-2xl font-extrabold text-navy-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM = { name: '', description: '', price: '', discount_percent: '0', stock: '', rating: '0', image_url: '', category_id: '', is_featured: false };

function Products() {
  const toast = useToast();
  const products = useAsync(() => api.products({ limit: 50, sort: 'newest' }).then((r) => r.products), []);
  const categories = useAsync(() => api.categories(), []);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? Products in past orders cannot be deleted.`)) return;
    try {
      await api.admin.deleteProduct(p.id);
      toast.show('Product deleted');
      products.retry();
    } catch (err) {
      toast.show((err as ApiError).message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <p className="text-slate-600">{products.data?.length ?? 0} products</p>
        <button className="btn-primary" onClick={() => setEditing('new')}>+ Add product</button>
      </div>

      {editing && (
        <ProductForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          categories={categories.data ?? []}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); products.retry(); }}
        />
      )}

      {products.loading ? <Spinner /> : products.error ? <ErrorMessage message={products.error} onRetry={products.retry} /> : !products.data?.length ? (
        <EmptyState title="No products yet" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.data.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-navy-800">{p.name}</td>
                  <td className="px-4 py-3">{p.category_name}</td>
                  <td className="px-4 py-3">{formatINR(p.final_price)}</td>
                  <td className={`px-4 py-3 ${p.stock <= 5 ? 'font-semibold text-amber-600' : ''}`}>{p.stock}</td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <button className="btn-ghost px-3 py-1.5" onClick={() => setEditing(p)}>Edit</button>
                    <button className="btn-danger" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductForm({ initial, categories, onCancel, onSaved }: { initial: Product | null; categories: Category[]; onCancel: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState(initial ? {
    name: initial.name, description: initial.description, price: String(initial.price), discount_percent: String(initial.discount_percent),
    stock: String(initial.stock), rating: String(initial.rating), image_url: initial.image_url, category_id: String(initial.category_id), is_featured: initial.is_featured,
  } : EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(), description: form.description.trim(), price: Number(form.price), discount_percent: Number(form.discount_percent),
      stock: Number(form.stock), rating: Number(form.rating), image_url: form.image_url.trim(), category_id: Number(form.category_id), is_featured: form.is_featured,
    };
    const v: Record<string, string> = {};
    if (!payload.name) v.name = 'Name is required';
    if (!(payload.price >= 0)) v.price = 'Enter a valid price';
    if (!Number.isInteger(payload.stock) || payload.stock < 0) v.stock = 'Stock must be a whole number ≥ 0';
    if (!payload.category_id) v.category_id = 'Choose a category';
    setErrors(v);
    if (Object.keys(v).length) return;

    setBusy(true);
    try {
      if (initial) await api.admin.updateProduct(initial.id, payload);
      else await api.admin.createProduct(payload);
      toast.show(initial ? 'Product updated' : 'Product created');
      onSaved();
    } catch (err) {
      const apiErr = err as ApiError;
      setErrors(apiErr.fieldErrors);
      toast.show(apiErr.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const f = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <form onSubmit={submit} noValidate className="card grid gap-4 p-6 sm:grid-cols-2" aria-label={initial ? 'Edit product' : 'New product'}>
      <h2 className="text-lg font-bold text-navy-800 sm:col-span-2">{initial ? `Edit: ${initial.name}` : 'New product'}</h2>
      <div className="sm:col-span-2"><label className="label" htmlFor="p-name">Name</label><input id="p-name" className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={f('name')} />{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}</div>
      <div className="sm:col-span-2"><label className="label" htmlFor="p-desc">Description</label><textarea id="p-desc" rows={3} className="input" value={form.description} onChange={f('description')} /></div>
      <div><label className="label" htmlFor="p-price">Price (₹)</label><input id="p-price" type="number" min={0} step="0.01" className={`input ${errors.price ? 'input-error' : ''}`} value={form.price} onChange={f('price')} />{errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}</div>
      <div><label className="label" htmlFor="p-disc">Discount %</label><input id="p-disc" type="number" min={0} max={90} className="input" value={form.discount_percent} onChange={f('discount_percent')} /></div>
      <div><label className="label" htmlFor="p-stock">Stock</label><input id="p-stock" type="number" min={0} className={`input ${errors.stock ? 'input-error' : ''}`} value={form.stock} onChange={f('stock')} />{errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}</div>
      <div><label className="label" htmlFor="p-rating">Rating (0–5)</label><input id="p-rating" type="number" min={0} max={5} step="0.1" className="input" value={form.rating} onChange={f('rating')} /></div>
      <div><label className="label" htmlFor="p-cat">Category</label>
        <select id="p-cat" className={`input ${errors.category_id ? 'input-error' : ''}`} value={form.category_id} onChange={f('category_id')}>
          <option value="">Select…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
      </div>
      <div><label className="label" htmlFor="p-img">Image URL</label><input id="p-img" className="input" value={form.image_url} onChange={f('image_url')} placeholder="https://…" /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} /> Featured on home page</label>
      <div className="flex gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Orders() {
  const { data, error, loading, retry } = useAsync(() => api.admin.orders(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={retry} />;
  if (!data?.length) return <EmptyState title="No orders yet" body="Demo orders will show up here." />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Total</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono">#{o.id.slice(0, 8).toUpperCase()}</td>
              <td className="px-4 py-3">{o.customer_email}</td>
              <td className="px-4 py-3">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
              <td className="px-4 py-3">{formatDate(o.created_at)}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatINR(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
