import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    api.get('/products?sort=rating&limit=8').then((r) => setFeatured(r.data.products));
    api.get('/brands').then((r) => setBrands(r.data));
  }, []);

  return (
    <div>
      <section className="border-b border-ink/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-wide text-gold mb-4">Multi-brand beauty</p>
            <h1 className="font-display text-4xl md:text-5xl leading-tight text-ink mb-6">
              Skincare, makeup and scent, chosen from brands that make their own rules.
            </h1>
            <p className="text-ink/70 max-w-md mb-8">
              Zarro brings together independent beauty labels — Glowbie, Velour, Nectar &amp; Bloom and Lumé — in one place you can actually browse.
            </p>
            <Link
              to="/shop"
              className="inline-block bg-plum text-white px-6 py-3 text-sm font-medium hover:bg-plum-dark focus-ring"
            >
              Shop all products
            </Link>
          </div>
          <div className="aspect-[4/5] bg-rose/30 flex items-center justify-center">
            <span className="font-display text-3xl text-plum/50">Zarro</span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl">Highly rated right now</h2>
          <Link to="/shop" className="text-sm text-plum hover:underline focus-ring">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-white border-t border-ink/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl md:text-3xl mb-8">Our brands</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {brands.map((b) => (
              <Link
                key={b.id}
                to={`/shop?brand=${b.slug}`}
                className="border border-ink/10 p-6 hover:border-plum transition-colors focus-ring"
              >
                <p className="font-display text-lg text-ink">{b.name}</p>
                <p className="text-sm text-ink/60 mt-1">{b.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
