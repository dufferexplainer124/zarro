import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(form.email, form.password);
    setSubmitting(false);
    if (result.success) {
      navigate(location.state?.from?.pathname || '/');
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="font-display text-3xl mb-2">Welcome back</h1>
      <p className="text-ink/60 mb-8 text-sm">Log in to your Zarro account.</p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm text-ink/70 mb-1" htmlFor="password">Password</label>
          <input
            id="password" type="password" required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-plum text-white py-2.5 text-sm font-medium hover:bg-plum-dark disabled:opacity-50 focus-ring"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        New to Zarro? <Link to="/register" className="text-plum hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
