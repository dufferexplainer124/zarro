const pool = require('../config/db');

function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getCategories(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
       FROM categories c ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = slugify(name);
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );
    res.status(201).json({ id: result.insertId, name, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create category (name may already exist)' });
  }
}

async function updateCategory(req, res) {
  try {
    const { name, description } = req.body;
    const slug = name ? slugify(name) : undefined;
    await pool.query(
      'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description) WHERE id = ?',
      [name || null, slug || null, description || null, req.params.id]
    );
    res.json({ message: 'Category updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update category' });
  }
}

async function deleteCategory(req, res) {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Cannot delete category — it may still have products assigned' });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
