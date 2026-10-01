import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import api from '../../api/axios';

const LINKS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/brands', label: 'Brands' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
];

export default function AdminDashboard() {
  const location = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl mb-8">Admin panel</h1>
      <div className="grid md:grid-cols-[200px_1fr] gap-10">
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active = link.end ? location.pathname === link.to : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm whitespace-nowrap focus-ring ${
                  active ? 'bg-plum text-white' : 'text-ink/70 hover:bg-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/orders/admin/stats').then((r) => setStats(r.data));
  }, []);

  if (!stats) return <p className="text-ink/50 text-sm">Loading dashboard…</p>;

  const cards = [
    { label: 'Active products', value: stats.productCount },
    { label: 'Customers', value: stats.userCount },
    { label: 'Orders', value: stats.orderCount },
    { label: 'Revenue', value: `$${Number(stats.revenue).toFixed(2)}` },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="border border-ink/10 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">{c.label}</p>
            <p className="font-display text-2xl">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg mb-4">Recent orders</h2>
      <div className="border border-ink/10 divide-y divide-ink/10">
        {stats.recentOrders.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-white focus-ring">
            <div>
              <p className="text-sm font-medium">{o.order_number}</p>
              <p className="text-xs text-ink/50">{o.customer_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs capitalize text-ink/50">{o.status}</span>
              <span className="text-sm font-medium">${Number(o.total).toFixed(2)}</span>
            </div>
          </Link>
        ))}
        {!stats.recentOrders.length && <p className="text-sm text-ink/50 px-4 py-6">No orders yet.</p>}
      </div>
    </div>
  );
}
