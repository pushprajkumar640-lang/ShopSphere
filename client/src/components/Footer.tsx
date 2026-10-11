import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 bg-navy-900 text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-xl font-extrabold text-white">Shop<span className="text-brand-accent">Sphere</span></p>
          <p className="mt-3 text-sm leading-relaxed">Curated products across electronics, fashion, home and fitness, with a simple and transparent shopping experience.</p>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-white">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-brand-accent" to="/products">All products</Link></li>
            <li><Link className="hover:text-brand-accent" to="/products?sort=price_asc">Best value</Link></li>
            <li><Link className="hover:text-brand-accent" to="/products?featured=true">Featured</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-white">Customer</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-brand-accent" to="/account">My orders</Link></li>
            <li><Link className="hover:text-brand-accent" to="/cart">Cart</Link></li>
            <li><Link className="hover:text-brand-accent" to="/login">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-white">Contact</h3>
          <ul className="space-y-2 text-sm">
            <li>support@shopsphere.example</li>
            <li>+91 00000 00000 (placeholder)</li>
            <li>Mon–Sat, 10:00–18:00 IST</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} ShopSphere. Built as a college project.</p>
          <p className="rounded bg-amber-400/20 px-2 py-1 text-amber-200">Demo mode: no real payments are processed.</p>
        </div>
      </div>
    </footer>
  );
}
