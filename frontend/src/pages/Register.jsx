import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await register(form.name, form.email, form.password, form.phone);
    setSubmitting(false);
    if (result.success) navigate('/');
    else setError(result.message);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="font-display text-3xl mb-2">Create your account</h1>
      <p className="text-ink/60 mb-8 text-sm">Join Zarro to save your cart and track orders.</p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-ink/70 mb-1" htmlFor="name">Full name</label>
          <input
            id="name" required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-sm text-ink/70 mb-1" htmlFor="email">Email</label>
          <input
            id="email" type="email" required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-sm text-ink/70 mb-1" htmlFor="phone">Phone (optional)</label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-sm text-ink/70 mb-1" htmlFor="password">Password</label>
          <input
            id="password" type="password" required minLength={6}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
          />
          <p className="text-xs text-ink/40 mt-1">At least 6 characters.</p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-plum text-white py-2.5 text-sm font-medium hover:bg-plum-dark disabled:opacity-50 focus-ring"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        Already have an account? <Link to="/login" className="text-plum hover:underline">Log in</Link>
      </p>
    </div>
  );
}
