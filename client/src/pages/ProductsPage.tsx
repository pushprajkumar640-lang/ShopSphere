import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorMessage, PageContainer, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { api } from '../services/api';
import type { ProductQuery } from '../lib/types';

const SORTS: { value: NonNullable<ProductQuery['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating_desc', label: 'Top rated' },
  { value: 'name_asc', label: 'Name A–Z' },
];

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const sort = (params.get('sort') as ProductQuery['sort']) || 'newest';
  const featured = params.get('featured') === 'true';
  const page = Number(params.get('page') || 1);
  const minPrice = params.get('minPrice') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';

  // Local input state for price fields, debounced before hitting the API.
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const debMin = useDebounce(minInput, 400);
  const debMax = useDebounce(maxInput, 400);

  useEffect(() => {
    if (debMin === minPrice && debMax === maxPrice) return;
    update({ minPrice: debMin, maxPrice: debMax, page: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debMin, debMax]);

  const categories = useAsync(() => api.categories(), []);

  const { data, error, loading, retry } = useAsync(
    () => api.products({
      search: search || undefined,
      category: category || undefined,
      sort,
      featured: featured || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page,
      limit: 12,
    }),
    [search, category, sort, featured, minPrice, maxPrice, page],
  );

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  }

  const clearFilters = () => { setMinInput(''); setMaxInput(''); setParams(new URLSearchParams()); };
  const activeFilters = Boolean(search || category || featured || minPrice || maxPrice || sort !== 'newest');

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-800">{search ? `Results for “${search}”` : 'All products'}</h1>
          {data && <p className="text-slate-500">{data.pagination.total} product{data.pagination.total === 1 ? '' : 's'} found</p>}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-700">Sort by</span>
          <select className="input w-auto py-2" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit space-y-6 p-5 lg:sticky lg:top-24" aria-label="Filters">
          <div>
            <h2 className="mb-3 font-semibold text-navy-800">Category</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="cat" checked={!category} onChange={() => update({ category: '' })} /> All categories</label>
              {categories.data?.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="cat" checked={category === c.slug} onChange={() => update({ category: c.slug })} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 font-semibold text-navy-800">Price (₹)</h2>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" type="number" min={0} inputMode="numeric" placeholder="Min" aria-label="Minimum price" value={minInput} onChange={(e) => setMinInput(e.target.value)} />
              <input className="input" type="number" min={0} inputMode="numeric" placeholder="Max" aria-label="Maximum price" value={maxInput} onChange={(e) => setMaxInput(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => update({ featured: e.target.checked ? 'true' : '' })} /> Featured only
          </label>
          {activeFilters && <button onClick={clearFilters} className="btn-ghost w-full">Clear all filters</button>}
        </aside>

        <section aria-live="polite">
          {loading ? <Spinner label="Finding products" /> : error ? <ErrorMessage message={error} onRetry={retry} /> : !data?.products.length ? (
            <EmptyState title="No products match your filters" body="Try a different search term or clear some filters." action={<button className="btn-primary" onClick={clearFilters}>Clear filters</button>} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {data.pagination.totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
                  <button className="btn-ghost" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>← Prev</button>
                  <span className="text-sm text-slate-600">Page {page} of {data.pagination.totalPages}</span>
                  <button className="btn-ghost" disabled={page >= data.pagination.totalPages} onClick={() => update({ page: String(page + 1) })}>Next →</button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
