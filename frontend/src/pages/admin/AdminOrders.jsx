import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const PAYMENT_STATUS_STYLES = {
  unpaid: 'text-ink/50',
  pending: 'text-amber-700',
  paid: 'text-green-700',
  failed: 'text-red-600',
  refunded: 'text-ink/50',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  async function load() {
    const { data } = await api.get('/orders/admin/all');
    setOrders(data);
  }
  useEffect(() => { load(); }, []);

  async function handleStatusChange(id, status) {
    await api.put(`/orders/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <h2 className="font-display text-xl mb-4">Orders</h2>
      <div className="border border-ink/10 divide-y divide-ink/10">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
            <div>
              <Link to={`/orders/${o.id}`} className="text-sm font-medium hover:text-plum">{o.order_number}</Link>
              <p className="text-xs text-ink/50">
                {o.customer_name} · {o.customer_email} ·{' '}
                <span className="capitalize">{o.payment_method}</span> ·{' '}
                <span className={`capitalize ${PAYMENT_STATUS_STYLES[o.payment_status] || ''}`}>{o.payment_status}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">${Number(o.total).toFixed(2)}</span>
              <select
                value={o.status}
                onChange={(e) => handleStatusChange(o.id, e.target.value)}
                className="border border-ink/20 px-2 py-1 text-sm capitalize focus-ring"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
