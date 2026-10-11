import { Link } from 'react-router-dom';
import type { Product } from '../lib/types';
import { formatINR } from '../utils/format';
import { Stars } from './ui';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const toast = useToast();
  const outOfStock = product.stock === 0;

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-navy-50">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
        />
        {product.discount_percent > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-accent px-2.5 py-1 text-xs font-bold text-navy-900">
            {product.discount_percent}% OFF
          </span>
        )}
        {outOfStock && <span className="absolute inset-0 flex items-center justify-center bg-white/70 font-semibold text-slate-700">Out of stock</span>}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.category_name}</p>
        <Link to={`/products/${product.id}`} className="line-clamp-2 font-semibold text-navy-800 hover:text-brand">
          {product.name}
        </Link>
        <Stars rating={product.rating} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-lg font-bold text-navy-900">{formatINR(product.final_price)}</p>
            {product.discount_percent > 0 && <p className="text-sm text-slate-400 line-through">{formatINR(product.price)}</p>}
          </div>
          <button
            className="btn-primary px-3 py-2 text-sm"
            disabled={outOfStock}
            onClick={() => { add(product); toast.show(`Added "${product.name}" to cart`); }}
          >
            {outOfStock ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
