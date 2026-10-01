import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const SHIPPING_FEE = 5.0;

const PAYMENT_OPTIONS = [
  { value: 'cod', label: 'Cash on delivery' },
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'jazzcash', label: 'JazzCash' },
];

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    shippingAddress: '', shippingCity: '', shippingState: '', shippingPostalCode: '', shippingCountry: 'Pakistan',
    paymentMethod: 'cod',
  });
  // Card fields never leave the browser as raw values — in a real integration
  // these would be handed to the gateway's own hosted-fields SDK, which
  // returns a token; only that token (never the PAN/CVV) would be sent to
  // our API. Kept here only so the field last-4 can be shown back to the user.
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [walletPhone, setWalletPhone] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!items.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-2xl mb-3">Nothing to check out</h1>
        <Link to="/shop" className="text-plum hover:underline">Go shop something first</Link>
      </div>
    );
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  const isCard = form.paymentMethod === 'visa' || form.paymentMethod === 'mastercard';
  const isWallet = form.paymentMethod === 'easypaisa' || form.paymentMethod === 'jazzcash';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isCard && (!card.number || card.number.replace(/\s/g, '').length < 12 || !card.cvv)) {
      setError('Enter a valid card number and CVV');
      return;
    }
    if (isWallet && !walletPhone) {
      setError('Enter the mobile number linked to your wallet');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', form);

      if (form.paymentMethod !== 'cod') {
        // NOTE (mock mode): a real integration would tokenize the card via the
        // gateway's SDK here and send only that token — never card.number/cvv.
        // meta below intentionally omits raw card data even in this demo.
        try {
          await api.post('/payments/initiate', {
            orderId: data.orderId,
            provider: form.paymentMethod,
            meta: isWallet ? { walletPhone } : { cardLast4: card.number.replace(/\s/g, '').slice(-4) },
          });
        } catch (payErr) {
          // Order already exists as unpaid/pending — surface the issue but
          // still route to the order page rather than losing the order.
          console.error(payErr);
        }
      }

      await clearCart();
      navigate(`/orders/${data.orderId}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  }

  const total = subtotal + SHIPPING_FEE;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl mb-8">Checkout</h1>

      <div className="grid md:grid-cols-[1fr_320px] gap-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

          <div className="space-y-5">
            <h2 className="font-display text-lg">Customer information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" name="customerName" value={form.customerName} onChange={handleChange} required />
              <Field label="Email" name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} required />
            </div>
            <Field label="Phone" name="customerPhone" value={form.customerPhone} onChange={handleChange} required />
          </div>

          <div className="space-y-5">
            <h2 className="font-display text-lg">Shipping details</h2>
            <Field label="Address" name="shippingAddress" value={form.shippingAddress} onChange={handleChange} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="City" name="shippingCity" value={form.shippingCity} onChange={handleChange} required />
              <Field label="State / Province" name="shippingState" value={form.shippingState} onChange={handleChange} />
              <Field label="Postal code" name="shippingPostalCode" value={form.shippingPostalCode} onChange={handleChange} />
            </div>
            <Field label="Country" name="shippingCountry" value={form.shippingCountry} onChange={handleChange} required />
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-lg">Payment method</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`border px-3 py-2.5 text-sm text-center cursor-pointer focus-ring ${
                    form.paymentMethod === opt.value ? 'border-plum bg-plum/5 text-plum' : 'border-ink/20 text-ink/70'
                  }`}
                >
                  <input
                    type="radio" name="paymentMethod" value={opt.value}
                    checked={form.paymentMethod === opt.value} onChange={handleChange}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {isCard && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <input
                  placeholder="Name on card" value={card.name}
                  onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                  className="border border-ink/20 bg-white px-3 py-2 text-sm focus-ring sm:col-span-2"
                />
                <input
                  placeholder="Card number" inputMode="numeric" value={card.number}
                  onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                  className="border border-ink/20 bg-white px-3 py-2 text-sm focus-ring sm:col-span-2"
                />
                <input
                  placeholder="MM/YY" value={card.expiry}
                  onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                  className="border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
                />
                <input
                  placeholder="CVV" inputMode="numeric" value={card.cvv}
                  onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                  className="border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
                />
                <p className="text-xs text-ink/40 sm:col-span-2">
                  This is a test/mock payment flow — no real charge is made and card details are not sent to or stored on our servers.
                </p>
              </div>
            )}

            {isWallet && (
              <div className="pt-2 space-y-2">
                <input
                  placeholder={`${form.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} mobile number`}
                  value={walletPhone}
                  onChange={(e) => setWalletPhone(e.target.value)}
                  className="border border-ink/20 bg-white px-3 py-2 text-sm focus-ring w-full sm:w-64"
                />
                <p className="text-xs text-ink/40">
                  Test/mock mode — you'll be asked to confirm on your device in a real integration.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-plum text-white py-3 text-sm font-medium hover:bg-plum-dark disabled:opacity-50 focus-ring"
          >
            {submitting ? 'Placing order…' : `Place order — $${total.toFixed(2)}`}
          </button>
        </form>

        <div className="border border-ink/10 p-6 h-fit">
          <h2 className="font-display text-lg mb-4">Order summary</h2>
          <ul className="space-y-3 mb-4 text-sm">
            {items.map((item) => {
              const unitPrice = item.discount_price && Number(item.discount_price) < Number(item.price)
                ? Number(item.discount_price) : Number(item.price);
              return (
                <li key={item.cart_item_id} className="flex justify-between gap-2">
                  <span className="text-ink/70">{item.name} × {item.quantity}</span>
                  <span>${(unitPrice * item.quantity).toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-ink/10 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-ink/60">Shipping</span><span>${SHIPPING_FEE.toFixed(2)}</span></div>
            <div className="flex justify-between font-medium text-base pt-2 border-t border-ink/10">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, required, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm text-ink/70 mb-1" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
      />
    </div>
  );
}
