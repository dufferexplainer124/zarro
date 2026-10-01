import { useEffect, useState } from 'react';
import api from '../../api/axios';

const emptyForm = {
  name: '', description: '', price: '', discountPrice: '', stock: '', sku: '', brandId: '', categoryId: '', status: 'active',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const [p, b, c] = await Promise.all([
      api.get('/products/admin/all'),
      api.get('/brands'),
      api.get('/categories'),
    ]);
    setProducts(p.data);
    setBrands(b.data);
    setCategories(c.data);
  }

  useEffect(() => { load(); }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name, description: '', price: p.price, discountPrice: p.compare_at_price || '',
      stock: p.stock, sku: '', brandId: p.brand_id || '', categoryId: p.category_id || '',
      status: p.is_active ? 'active' : 'inactive',
    });
    setExistingImageUrl(p.image_url || '');
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setExistingImageUrl('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('price', form.price);
      if (form.discountPrice) data.append('discountPrice', form.discountPrice);
      data.append('stock', form.stock || 0);
      if (form.sku) data.append('sku', form.sku);
      data.append('brandId', form.brandId);
      data.append('categoryId', form.categoryId);
      data.append('status', form.status);
      if (imageFile) data.append('image', imageFile);

      // Don't set Content-Type manually — axios detects FormData and adds the
      // correct multipart boundary automatically; overriding it here would
      // send a boundary-less header and break the upload.
      if (editingId) {
        await api.put(`/products/${editingId}`, data);
      } else {
        await api.post('/products', data);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id) {
    if (!confirm('Remove this product from the storefront? (It will stay in this list, marked inactive.)')) return;
    await api.delete(`/products/${id}`);
    load();
  }

  async function handleActivate(id) {
    await api.put(`/products/${id}`, { status: 'active' });
    load();
  }

  return (
    <div>
      <h2 className="font-display text-xl mb-4">{editingId ? 'Edit product' : 'Add a product'}</h2>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 mb-4 bg-white border border-ink/10 p-5">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Product name" required className="border border-ink/20 px-3 py-2 text-sm focus-ring sm:col-span-2" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border border-ink/20 px-3 py-2 text-sm focus-ring sm:col-span-2" rows={2} />

        <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="Price" required className="border border-ink/20 px-3 py-2 text-sm focus-ring" />
        <input name="discountPrice" type="number" step="0.01" value={form.discountPrice} onChange={handleChange} placeholder="Discount price (optional)" className="border border-ink/20 px-3 py-2 text-sm focus-ring" />
        <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="Stock" className="border border-ink/20 px-3 py-2 text-sm focus-ring" />
        <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU (optional)" className="border border-ink/20 px-3 py-2 text-sm focus-ring" />

        <div className="sm:col-span-2">
          <label className="block text-sm text-ink/70 mb-1">Product image</label>
          <input
            type="file" accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          {(imageFile || existingImageUrl) && (
            <p className="text-xs text-ink/50 mt-1">
              {imageFile ? imageFile.name : `Current: ${existingImageUrl}`}
            </p>
          )}
        </div>

        <select name="brandId" value={form.brandId} onChange={handleChange} required className="border border-ink/20 px-3 py-2 text-sm focus-ring">
          <option value="">Select brand</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select name="categoryId" value={form.categoryId} onChange={handleChange} required className="border border-ink/20 px-3 py-2 text-sm focus-ring">
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" value={form.status} onChange={handleChange} className="border border-ink/20 px-3 py-2 text-sm focus-ring">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" disabled={saving} className="bg-plum text-white px-5 py-2 text-sm font-medium hover:bg-plum-dark disabled:opacity-50 focus-ring">
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-5 py-2 text-sm border border-ink/20 focus-ring">Cancel</button>
          )}
        </div>
      </form>

      <div className="border border-ink/10 divide-y divide-ink/10">
        {products.map((p) => (
          <div key={p.id} className={`flex items-center justify-between px-4 py-3 gap-3 ${!p.is_active ? 'opacity-50' : ''}`}>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {p.name} {!p.is_active && <span className="text-xs text-red-500">(inactive)</span>}
              </p>
              <p className="text-xs text-ink/50">
                {p.brand_name} · {p.category_name} · ${Number(p.price).toFixed(2)}
                {p.compare_at_price && <span> (sale ${Number(p.compare_at_price).toFixed(2)})</span>} · stock {p.stock}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => startEdit(p)} className="text-sm text-plum hover:underline focus-ring">Edit</button>
              {p.is_active ? (
                <button onClick={() => handleDeactivate(p.id)} className="text-sm text-ink/50 hover:text-red-600 focus-ring">Deactivate</button>
              ) : (
                <button onClick={() => handleActivate(p.id)} className="text-sm text-green-700 hover:underline focus-ring">Activate</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
