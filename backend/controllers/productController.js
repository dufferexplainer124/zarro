const pool = require('../config/db');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/products
// Supports: ?search=&category=&brand=&minPrice=&maxPrice=&sort=&page=&limit=
async function getProducts(req, res) {
  try {
    const {
      search,
      category,   // category slug
      brand,      // brand slug
      minPrice,
      maxPrice,
      sort,       // 'price_asc' | 'price_desc' | 'newest' | 'rating'
      page = 1,
      limit = 12,
    } = req.query;

    const where = ["p.is_active = 1"];
    const params = [];

    if (search) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    if (brand) {
      where.push('b.slug = ?');
      params.push(brand);
    }
    if (minPrice) {
      where.push('p.price >= ?');
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      where.push('p.price <= ?');
      params.push(Number(maxPrice));
    }

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    if (sort === 'price_desc') orderBy = 'p.price DESC';
    if (sort === 'rating') orderBy = 'p.rating DESC';
    if (sort === 'newest') orderBy = 'p.created_at DESC';

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.stock, p.image_url,
              p.rating, p.created_at,
              b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.json({
      products: rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
}

// GET /api/products/:slug
async function getProductBySlug(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, b.name AS brand_name, b.slug AS brand_slug,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });

    const [images] = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
      [rows[0].id]
    );

    const [related] = await pool.query(
      `SELECT id, name, slug, price, compare_at_price, image_url, rating FROM products
       WHERE category_id = ? AND id != ? AND is_active = 1 LIMIT 4`,
      [rows[0].category_id, rows[0].id]
    );

    res.json({ ...rows[0], gallery: images.map((i) => i.image_url), related });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}

// ---- Admin ----

// POST /api/products
// Accepts either a JSON body with imageUrl, or multipart/form-data with an
// `image` file (see routes/uploadRoutes.js + middleware/uploadMiddleware.js).
async function createProduct(req, res) {
  try {
    const { name, description, price, discountPrice, stock, sku, brandId, categoryId, status } = req.body;
    if (!name || !price || !brandId || !categoryId) {
      return res.status(400).json({ message: 'name, price, brandId and categoryId are required' });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || null);
    const slug = slugify(name);
    const isActive = status === 'inactive' ? 0 : 1;
    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, compare_at_price, stock, sku, image_url, brand_id, category_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, slug, description || null, price, discountPrice || null, stock || 0,
        sku || null, imageUrl, brandId, categoryId, isActive,
      ]
    );
    res.status(201).json({ id: result.insertId, slug, imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create product' });
  }
}

// PUT /api/products/:id
// Also used to activate/deactivate a product by sending { status: 'active' | 'inactive' }
async function updateProduct(req, res) {
  try {
    const { name, description, price, discountPrice, stock, sku, brandId, categoryId, status } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl;

    const fields = [];
    const params = [];

    const map = {
      name: 'name', description: 'description', price: 'price',
      discountPrice: 'compare_at_price', stock: 'stock', sku: 'sku',
      imageUrl: 'image_url', brandId: 'brand_id', categoryId: 'category_id',
    };
    const body = { name, description, price, discountPrice, stock, sku, imageUrl, brandId, categoryId };

    Object.entries(body).forEach(([key, val]) => {
      if (val !== undefined) {
        fields.push(`${map[key]} = ?`);
        params.push(val);
      }
    });

    if (status !== undefined) {
      fields.push('is_active = ?');
      params.push(status === 'inactive' ? 0 : 1);
    }

    if (name) {
      fields.push('slug = ?');
      params.push(slugify(name));
    }
    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });

    params.push(req.params.id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update product' });
  }
}

// DELETE /api/products/:id (soft delete — flips is_active to 0, keeps order history intact)
async function deleteProduct(req, res) {
  try {
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
}

// GET /api/products/admin/all (includes inactive, for admin table)
async function getAllProductsAdmin(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.stock, p.is_active, p.image_url,
              b.id AS brand_id, b.name AS brand_name, c.id AS category_id, c.name AS category_name
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
}

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
};