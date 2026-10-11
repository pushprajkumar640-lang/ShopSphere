import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorMessage, PageContainer, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';

const BENEFITS = [
  { icon: '🚚', title: 'Free shipping', text: 'On all orders above ₹999.' },
  { icon: '🔒', title: 'Secure accounts', text: 'Passwords are hashed and sessions are protected.' },
  { icon: '↩️', title: 'Easy returns', text: 'Hassle-free returns within 14 days.' },
  { icon: '💬', title: 'Human support', text: 'Mon–Sat support you can actually reach.' },
];

export default function HomePage() {
  const featured = useAsync(() => api.products({ featured: true, limit: 8, sort: 'rating_desc' }).then((r) => r.products), []);
  const categories = useAsync(() => api.categories(), []);
  const offers = useAsync(() => api.products({ sort: 'price_asc', limit: 4 }).then((r) => r.products.filter((p) => p.discount_percent >= 20)), []);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-700 to-navy-500 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-accent/20 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="animate-fadeUp">
            <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-brand-accent">New season, new essentials</p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Everything you need, <span className="text-brand-accent">within one sphere.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">Discover quality electronics, fashion, home and fitness products at prices that make sense.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn-accent px-7 py-3 text-base">Shop Now</Link>
              <Link to="/products?featured=true" className="btn-ghost border-white/30 bg-transparent px-7 py-3 text-base text-white hover:bg-white/10">View featured</Link>
            </div>
          </div>
          <div className="hidden animate-fadeUp justify-center lg:flex" aria-hidden>
            <div className="grid grid-cols-2 gap-4">
              {['🎧', '⌚', '👕', '🪴'].map((e, i) => (
                <div key={e} className={`flex h-36 w-36 items-center justify-center rounded-3xl bg-white/10 text-5xl shadow-2xl backdrop-blur ${i % 2 ? 'translate-y-6' : ''}`}>{e}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PageContainer>
        <section aria-labelledby="cats" className="mb-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 id="cats" className="text-2xl font-bold text-navy-800">Shop by category</h2>
          </div>
          {categories.loading ? <Spinner /> : categories.error ? <ErrorMessage message={categories.error} onRetry={categories.retry} /> : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {categories.data?.map((c) => (
                <Link key={c.id} to={`/products?category=${c.slug}`} className="card group p-5 text-center transition hover:-translate-y-1 hover:ring-brand">
                  <p className="font-semibold text-navy-800 group-hover:text-brand">{c.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.product_count} items</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="featured" className="mb-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 id="featured" className="text-2xl font-bold text-navy-800">Featured products</h2>
            <Link to="/products?featured=true" className="font-medium text-brand hover:underline">See all →</Link>
          </div>
          {featured.loading ? <Spinner /> : featured.error ? <ErrorMessage message={featured.error} onRetry={featured.retry} /> : featured.data?.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.data.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : <EmptyState title="No featured products yet" />}
        </section>

        {offers.data && offers.data.length > 0 && (
          <section aria-labelledby="offers" className="mb-14 rounded-3xl bg-navy-800 p-8 text-white sm:p-10">
            <h2 id="offers" className="text-2xl font-bold">Special offers</h2>
            <p className="mb-6 text-white/70">Up to 40% off on selected items. Limited stock.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {offers.data.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="rounded-2xl bg-white/10 p-4 transition hover:bg-white/20">
                  <p className="text-sm text-brand-accent">{p.discount_percent}% off</p>
                  <p className="mt-1 line-clamp-2 font-semibold">{p.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="benefits" className="mb-6">
          <h2 id="benefits" className="sr-only">Why ShopSphere</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card p-6 transition hover:shadow-lg">
                <div className="text-3xl" aria-hidden>{b.icon}</div>
                <h3 className="mt-3 font-semibold text-navy-800">{b.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{b.text}</p>
              </div>
            ))}
          </div>
        </section>
      </PageContainer>
    </>
  );
}
