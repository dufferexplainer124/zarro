import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') || '1',
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
    api.get('/brands').then((r) => setBrands(r.data));
  }, []);

  function updateFilters(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.delete('page');
    setSearchParams(next);
    setFiltersOpen(false);
  }

  function goToPage(p) {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">
          {filters.search ? `Results for “${filters.search}”` : 'Shop all products'}
        </h1>
        <button
          className="md:hidden border border-ink/20 px-3 py-1.5 text-sm focus-ring"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          Filters
        </button>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-10">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <Filters categories={categories} brands={brands} filters={filters} onChange={updateFilters} />
        </aside>

        <div>
          {loading ? (
            <p className="text-ink/50 py-20 text-center">Loading products…</p>
          ) : products.length === 0 ? (
            <p className="text-ink/50 py-20 text-center">No products match these filters.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 text-sm focus-ring ${
                        Number(filters.page) === p ? 'bg-plum text-white' : 'border border-ink/20 hover:border-plum'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
