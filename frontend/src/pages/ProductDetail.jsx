import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    setLoading(true);
    setStatus(null);
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data);
      setActiveImage(r.data.image_url);
      setQuantity(1);
    }).finally(() => setLoading(false));
  }, [slug]);

  async function handleAddToCart() {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${slug}` } } });
      return;
    }
    try {
      await addToCart(product.id, quantity);
      setStatus({ type: 'success', message: 'Added to cart' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Could not add to cart' });
    }
  }

  if (loading) return <p className="text-center py-24 text-ink/50">Loading…</p>;
  if (!product) return <p className="text-center py-24 text-ink/50">Product not found.</p>;

  const onSale = product.discount_price && Number(product.discount_price) < Number(product.price);
  const displayPrice = onSale ? product.discount_price : product.price;
  const gallery = [product.image_url, ...(product.gallery || [])].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-sm text-ink/50 mb-8">
        <Link to="/shop" className="hover:text-plum">Shop</Link> /{' '}
        <Link to={`/shop?category=${product.category_slug}`} className="hover:text-plum">{product.category_name}</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <div className="aspect-square bg-rose/20 mb-3 flex items-center justify-center overflow-hidden">
            {activeImage ? (
              <img src={getImageUrl(activeImage)} alt={product.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            ) : (
              <span className="font-display text-2xl text-plum/40">{product.brand_name}</span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 bg-rose/20 border ${activeImage === img ? 'border-plum' : 'border-transparent'} focus-ring`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gold mb-2">{product.brand_name}</p>
          <h1 className="font-display text-3xl mb-3">{product.name}</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-ink/60">★ {Number(product.rating).toFixed(1)}</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl text-plum font-medium">${Number(displayPrice).toFixed(2)}</span>
            {onSale && <span className="text-base text-ink/40 line-through">${Number(product.price).toFixed(2)}</span>}
          </div>

          <p className="text-ink/70 leading-relaxed mb-8 max-w-md">{product.description}</p>

          <p className="text-sm mb-6">
            {product.stock > 0 ? (
              <span className="text-green-700">In stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-ink/20">
              <button
                className="w-9 h-9 focus-ring"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                className="w-9 h-9 focus-ring"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock < 1}
              className="flex-1 bg-plum text-white py-2.5 text-sm font-medium hover:bg-plum-dark disabled:opacity-40 focus-ring"
            >
              {product.stock < 1 ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>

          {status && (
            <p className={`text-sm ${status.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
              {status.message}
            </p>
          )}
        </div>
      </div>

      {product.related?.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl mb-8">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
