import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { summary } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('search') ?? '');
  const [menuOpen, setMenuOpen] = useState(false);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setMenuOpen(false);
  };

  const onLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'text-brand-accent' : 'text-white/85 hover:text-white'}`;

  return (
    <header className="sticky top-0 z-40 bg-navy-800 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight" aria-label="ShopSphere home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent text-navy-900">S</span>
          <span>Shop<span className="text-brand-accent">Sphere</span></span>
        </Link>

        <form onSubmit={onSearch} role="search" className="mx-auto hidden max-w-xl flex-1 md:block">
          <label htmlFor="search" className="sr-only">Search products</label>
          <input
            id="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          <NavLink to="/products" className={linkCls}>Shop</NavLink>
          {user && <NavLink to="/account" className={linkCls}>My Orders</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="max-w-[120px] truncate text-sm text-white/80">Hi, {user.name.split(' ')[0]}</span>
              <button onClick={onLogout} className="rounded-md border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="hidden rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/10 sm:inline-block">Sign in</Link>
          )}

          <Link to="/cart" className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10" aria-label={`Cart with ${summary.itemCount} items`}>
            <span aria-hidden className="text-lg">🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {summary.itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-xs font-bold text-navy-900">
                {summary.itemCount}
              </span>
            )}
          </Link>

          <button
            className="rounded-md p-2 hover:bg-white/10 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="block text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="space-y-2 border-t border-white/10 px-4 pb-4 pt-2 lg:hidden">
          <form onSubmit={onSearch} role="search" className="md:hidden">
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products…" aria-label="Search products" className="w-full rounded-full bg-white px-4 py-2 text-slate-900" />
          </form>
          <NavLink to="/products" onClick={() => setMenuOpen(false)} className="block py-2 text-white/90">Shop</NavLink>
          {user && <NavLink to="/account" onClick={() => setMenuOpen(false)} className="block py-2 text-white/90">My Orders</NavLink>}
          {isAdmin && <NavLink to="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-white/90">Admin</NavLink>}
          {user ? (
            <button onClick={onLogout} className="block py-2 text-white/90">Logout</button>
          ) : (
            <NavLink to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-white/90">Sign in</NavLink>
          )}
        </div>
      )}
    </header>
  );
}
