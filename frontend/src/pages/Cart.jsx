import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem, loading } = useCart();

  if (loading) return <p className="text-center py-24 text-ink/50">Loading cart…</p>;

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-2xl mb-3">Your cart is empty</h1>
        <p className="text-ink/60 mb-8">Nothing here yet — go find something worth adding.</p>
        <Link to="/shop" className="inline-block bg-plum text-white px-6 py-3 text-sm font-medium hover:bg-plum-dark focus-ring">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl mb-8">Your cart</h1>

      <div className="grid md:grid-cols-[1fr_320px] gap-10">
        <ul className="divide-y divide-ink/10">
          {items.map((item) => {
            const onSale = item.discount_price && Number(item.discount_price) < Number(item.price);
            const unitPrice = onSale ? Number(item.discount_price) : Number(item.price);
            return (
            <li key={item.cart_item_id} className="py-5 flex gap-4">
              <Link to={`/product/${item.slug}`} className="w-20 h-20 bg-rose/20 shrink-0 overflow-hidden">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-ink/50">{item.brand_name}</p>
                <Link to={`/product/${item.slug}`} className="font-display text-base hover:text-plum">{item.name}</Link>
                <p className="text-sm text-plum mt-1">
                  ${unitPrice.toFixed(2)}
                  {onSale && <span className="text-ink/40 line-through ml-2 text-xs">${Number(item.price).toFixed(2)}</span>}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center border border-ink/20">
                    <button
                      className="w-8 h-8 focus-ring"
                      onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-sm">{item.quantity}</span>
                    <button
                      className="w-8 h-8 focus-ring"
                      onClick={() => updateQuantity(item.cart_item_id, Math.min(item.stock, item.quantity + 1))}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.cart_item_id)}
                    className="text-sm text-ink/50 hover:text-plum focus-ring"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium">${(unitPrice * item.quantity).toFixed(2)}</p>
            </li>
            );
          })}
        </ul>

        <div className="border border-ink/10 p-6 h-fit">
          <h2 className="font-display text-lg mb-4">Order summary</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-ink/60">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-ink/60">Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <Link
            to="/checkout"
            className="block text-center bg-plum text-white py-2.5 text-sm font-medium hover:bg-plum-dark focus-ring"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
