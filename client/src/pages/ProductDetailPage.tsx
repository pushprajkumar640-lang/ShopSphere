import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorMessage, PageContainer, Spinner, Stars } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { formatINR } from '../utils/format';

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { add } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const { data: product, error, loading, retry } = useAsync(
    () => (Number.isInteger(productId) && productId > 0 ? api.product(productId) : Promise.reject(new Error('Invalid product'))),
    [productId],
  );

  if (loading) return <PageContainer><Spinner label="Loading product" /></PageContainer>;
  if (error || !product) return (
    <PageContainer>
      <ErrorMessage message={error === 'Product not found' ? 'We could not find that product.' : error || 'Product unavailable'} onRetry={retry} />
      <div className="text-center"><Link to="/products" className="font-medium text-brand hover:underline">← Back to all products</Link></div>
    </PageContainer>
  );

  const outOfStock = product.stock === 0;
  const maxQty = Math.min(product.stock, 20);

  return (
    <PageContainer>
      <nav className="mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand">Home</Link> / <Link to={`/products?category=${product.category_slug}`} className="hover:text-brand">{product.category_name}</Link> / <span className="text-slate-700">{product.name}</span>
      </nav>
      <div className="card grid gap-10 overflow-hidden p-6 md:grid-cols-2 md:p-10">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-navy-50">
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          {product.discount_percent > 0 && <span className="absolute left-4 top-4 rounded-full bg-brand-accent px-3 py-1 font-bold text-navy-900">{product.discount_percent}% OFF</span>}
        </div>
        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{product.category_name}</p>
          <h1 className="text-3xl font-extrabold text-navy-900">{product.name}</h1>
          <Stars rating={product.rating} />
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-navy-900">{formatINR(product.final_price)}</span>
            {product.discount_percent > 0 && <span className="text-lg text-slate-400 line-through">{formatINR(product.price)}</span>}
          </div>
          <p className="leading-relaxed text-slate-600">{product.description}</p>
          <p className={`text-sm font-medium ${product.stock === 0 ? 'text-red-600' : product.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left!` : 'In stock'}
          </p>

          {!outOfStock && (
            <div className="flex items-center gap-3">
              <label htmlFor="qty" className="font-medium">Quantity</label>
              <div className="flex items-center overflow-hidden rounded-lg border border-slate-300">
                <button className="px-3 py-2 hover:bg-slate-100" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <input id="qty" type="number" min={1} max={maxQty} value={qty} onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))} className="w-14 border-x border-slate-300 py-2 text-center focus:outline-none" />
                <button className="px-3 py-2 hover:bg-slate-100" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase quantity">+</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button className="btn-primary px-6 py-3" disabled={outOfStock} onClick={() => { add(product, qty); toast.show(`Added ${qty} × "${product.name}" to cart`); }}>
              Add to cart
            </button>
            <button className="btn-accent px-6 py-3" disabled={outOfStock} onClick={() => { add(product, qty); navigate('/cart'); }}>
              Buy now
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
