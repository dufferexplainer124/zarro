const pool = require('../config/db');

function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getBrands(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.name, b.slug, b.logo_url, b.description,
              (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = 1) AS product_count
       FROM brands b ORDER BY b.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch brands' });
  }
}

async function createBrand(req, res) {
  try {
    const { name, description, logoUrl } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = slugify(name);
    const [result] = await pool.query(
      'INSERT INTO brands (name, slug, description, logo_url) VALUES (?, ?, ?, ?)',
      [name, slug, description || null, logoUrl || null]
    );
    res.status(201).json({ id: result.insertId, name, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create brand (name may already exist)' });
  }
}

async function updateBrand(req, res) {
  try {
    const { name, description, logoUrl } = req.body;
    const slug = name ? slugify(name) : undefined;
    await pool.query(
      'UPDATE brands SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), logo_url = COALESCE(?, logo_url) WHERE id = ?',
      [name || null, slug || null, description || null, logoUrl || null, req.params.id]
    );
    res.json({ message: 'Brand updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update brand' });
  }
}

async function deleteBrand(req, res) {
  try {
    await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Cannot delete brand — it may still have products assigned' });
  }
}

module.exports = { getBrands, createBrand, updateBrand, deleteBrand };
