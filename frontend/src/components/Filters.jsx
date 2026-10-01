export default function Filters({ categories, brands, filters, onChange }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-lg mb-3">Category</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <button
              className={`focus-ring ${!filters.category ? 'text-plum font-medium' : 'text-ink/70 hover:text-plum'}`}
              onClick={() => onChange({ category: '' })}
            >
              All categories
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                className={`focus-ring ${filters.category === c.slug ? 'text-plum font-medium' : 'text-ink/70 hover:text-plum'}`}
                onClick={() => onChange({ category: c.slug })}
              >
                {c.name} <span className="text-ink/40">({c.product_count})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-lg mb-3">Brand</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <button
              className={`focus-ring ${!filters.brand ? 'text-plum font-medium' : 'text-ink/70 hover:text-plum'}`}
              onClick={() => onChange({ brand: '' })}
            >
              All brands
            </button>
          </li>
          {brands.map((b) => (
            <li key={b.id}>
              <button
                className={`focus-ring ${filters.brand === b.slug ? 'text-plum font-medium' : 'text-ink/70 hover:text-plum'}`}
                onClick={() => onChange({ brand: b.slug })}
              >
                {b.name} <span className="text-ink/40">({b.product_count})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-lg mb-3">Sort by</h3>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="w-full border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>
    </div>
  );
}
