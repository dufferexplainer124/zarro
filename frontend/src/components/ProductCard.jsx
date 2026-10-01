import { Link } from 'react-router-dom';
import { getImageUrl } from '../api/axios';

export default function ProductCard({ product }) {
  const onSale = product.discount_price && Number(product.discount_price) < Number(product.price);
  const displayPrice = onSale ? product.discount_price : product.price;

  return (
    <Link to={`/product/${product.slug}`} className="group block focus-ring">
      <div className="aspect-[4/5] bg-rose/20 overflow-hidden mb-3 relative">
        {product.image_url ? (
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-plum/40 font-display text-lg">
            {product.brand_name}
          </div>
        )}
        {onSale && (
          <span className="absolute top-2 left-2 bg-plum text-white text-[11px] px-2 py-1">Sale</span>
        )}
      </div>
      <p className="text-xs uppercase tracking-wide text-ink/50">{product.brand_name}</p>
      <h3 className="font-display text-base text-ink mt-0.5 leading-snug">{product.name}</h3>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-medium text-plum">${Number(displayPrice).toFixed(2)}</span>
        {onSale && (
          <span className="text-xs text-ink/40 line-through">${Number(product.price).toFixed(2)}</span>
        )}
      </div>
    </Link>
  );
}
