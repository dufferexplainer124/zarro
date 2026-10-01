import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_STYLES = {
  unpaid: 'text-ink/50',
  pending: 'text-amber-700',
  paid: 'text-green-700',
  failed: 'text-red-600',
  refunded: 'text-ink/50',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-24 text-ink/50">Loading orders…</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl mb-8">Order history</h1>

      {!orders.length ? (
        <div className="text-center py-16">
          <p className="text-ink/60 mb-6">You haven't placed any orders yet.</p>
          <Link to="/shop" className="text-plum hover:underline">Start shopping</Link>
        </div>
      ) : (
        <div className="border border-ink/10 divide-y divide-ink/10">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-white focus-ring gap-3 flex-wrap"
            >
              <div>
                <p className="font-medium">{o.order_number}</p>
                <p className="text-sm text-ink/50">
                  {new Date(o.created_at).toLocaleDateString()} ·{' '}
                  <span className={PAYMENT_STATUS_STYLES[o.payment_status] || ''}>{o.payment_status}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_STYLES[o.status] || ''}`}>
                  {o.status}
                </span>
                <span className="text-sm font-medium w-16 text-right">${Number(o.total).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
