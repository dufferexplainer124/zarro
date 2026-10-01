import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/users');
    setUsers(data);
  }
  useEffect(() => { load(); }, []);

  async function handleStatusToggle(u) {
    setError('');
    try {
      await api.put(`/users/${u.id}/status`, { status: u.status === 'active' ? 'suspended' : 'active' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  }

  async function handleRoleToggle(u) {
    setError('');
    try {
      await api.put(`/users/${u.id}/role`, { role: u.role === 'admin' ? 'customer' : 'admin' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl mb-4">Users</h2>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>}

      <div className="border border-ink/10 divide-y divide-ink/10">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium">
                {u.name} <span className="text-xs text-ink/40 capitalize">({u.role})</span>
              </p>
              <p className="text-xs text-ink/50">{u.email} · {u.order_count} orders</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {u.status}
              </span>
              <button onClick={() => handleRoleToggle(u)} className="text-sm text-plum hover:underline focus-ring">
                {u.role === 'admin' ? 'Make customer' : 'Make admin'}
              </button>
              <button onClick={() => handleStatusToggle(u)} className="text-sm text-ink/50 hover:text-red-600 focus-ring">
                {u.status === 'active' ? 'Suspend' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
