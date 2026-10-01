const pool = require('../config/db');

async function getCart(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity,
              p.id AS product_id, p.name, p.slug, p.price, p.compare_at_price, p.image_url, p.stock,
              b.name AS brand_name
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN brands b ON b.id = p.brand_id
       WHERE ci.user_id = ? AND p.is_active = 1
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );
    const effectivePrice = (r) =>
      r.compare_at_price && Number(r.compare_at_price) < Number(r.price) ? Number(r.compare_at_price) : Number(r.price);
    const subtotal = rows.reduce((sum, r) => sum + effectivePrice(r) * r.quantity, 0);
    res.json({ items: rows, subtotal: Number(subtotal.toFixed(2)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
}

// POST /api/cart  { productId, quantity }
async function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const [productRows] = await pool.query("SELECT id, stock FROM products WHERE id = ? AND status = 'active'", [productId]);
    if (!productRows.length) return res.status(404).json({ message: 'Product not found' });
    if (productRows[0].stock < 1) return res.status(400).json({ message: 'Product is out of stock' });

    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, productId, quantity]
    );

    res.status(201).json({ message: 'Added to cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add to cart' });
  }
}

// PUT /api/cart/:cartItemId  { quantity }
async function updateCartItem(req, res) {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'quantity must be at least 1' });
    }
    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.cartItemId, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Cart item not found' });
    res.json({ message: 'Cart updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update cart' });
  }
}

// DELETE /api/cart/:cartItemId
async function removeCartItem(req, res) {
  try {
    await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.cartItemId, req.user.id]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove item' });
  }
}

// DELETE /api/cart
async function clearCart(req, res) {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
