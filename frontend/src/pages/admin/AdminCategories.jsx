import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/categories');
    setCategories(data);
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', { name, description });
      setName('');
      setDescription('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl mb-4">Categories</h2>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 mb-6 bg-white border border-ink/10 p-5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required className="border border-ink/20 px-3 py-2 text-sm focus-ring flex-1 min-w-[160px]" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="border border-ink/20 px-3 py-2 text-sm focus-ring flex-1 min-w-[160px]" />
        <button type="submit" className="bg-plum text-white px-5 py-2 text-sm font-medium hover:bg-plum-dark focus-ring">Add</button>
      </form>
      <div className="border border-ink/10 divide-y divide-ink/10">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-ink/50">{c.product_count} products</p>
            </div>
            <button onClick={() => handleDelete(c.id)} className="text-sm text-ink/50 hover:text-red-600 focus-ring">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
