import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../api/axios';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_LABELS = {
  cod: 'Cash on delivery', visa: 'Visa', mastercard: 'Mastercard', easypaisa: 'EasyPaisa', jazzcash: 'JazzCash',
};

const PAYMENT_STATUS_STYLES = {
  unpaid: 'bg-ink/10 text-ink/60',
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-ink/10 text-ink/60',
};

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center py-24 text-ink/50">Loading order…</p>;
  if (!order) return <p className="text-center py-24 text-ink/50">Order not found.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {location.state?.justPlaced && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 mb-8">
          Your order has been placed. We'll update the status as it moves through fulfillment.
        </div>
      )}

      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl mb-1">{order.order_number}</h1>
          <p className="text-sm text-ink/50">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-full capitalize ${STATUS_STYLES[order.status] || ''}`}>
            {order.status}
          </span>
          <span className={`text-xs px-3 py-1.5 rounded-full capitalize ${PAYMENT_STATUS_STYLES[order.payment_status] || ''}`}>
            {order.payment_status}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="font-display text-lg mb-2">Customer</h2>
          <p className="text-sm text-ink/70 leading-relaxed">
            {order.customer_name}<br />
            {order.customer_email}<br />
            {order.customer_phone}
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg mb-2">Shipping to</h2>
          <p className="text-sm text-ink/70 leading-relaxed">
            {order.shipping_address}<br />
            {order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_postal_code}<br />
            {order.shipping_country}
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg mb-2">Payment</h2>
          <p className="text-sm text-ink/70">{PAYMENT_LABELS[order.payment_method] || order.payment_method}</p>
        </div>
      </div>

      <h2 className="font-display text-lg mb-4">Items</h2>
      <ul className="divide-y divide-ink/10 border-t border-b border-ink/10 mb-8">
        {order.items.map((item) => (
          <li key={item.id} className="py-4 flex justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">{item.brand_name}</p>
              <p className="font-display">{item.product_name}</p>
              <p className="text-sm text-ink/50">Qty {item.quantity} × ${Number(item.price).toFixed(2)}</p>
            </div>
            <p className="text-sm font-medium">${Number(item.line_total).toFixed(2)}</p>
          </li>
        ))}
      </ul>

      <div className="max-w-xs ml-auto space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-ink/60">Shipping</span><span>${Number(order.shipping_fee).toFixed(2)}</span></div>
        <div className="flex justify-between font-medium text-base pt-2 border-t border-ink/10">
          <span>Total</span><span>${Number(order.total).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-10">
        <Link to="/orders" className="text-sm text-plum hover:underline">← Back to order history</Link>
      </div>
    </div>
  );
}
