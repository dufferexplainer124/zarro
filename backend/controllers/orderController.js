const pool = require('../config/db');

function generateOrderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ZR-${Date.now().toString().slice(-8)}-${rand}`;
}

const SHIPPING_FEE = 5.0;
const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_METHODS = ['cod', 'visa', 'mastercard', 'easypaisa', 'jazzcash'];

// POST /api/orders
// body: { customerName, customerEmail, customerPhone, shippingAddress, shippingCity,
//         shippingState, shippingPostalCode, shippingCountry, paymentMethod }
// Card/wallet payments are captured separately via /api/payments/initiate once the
// order exists — this endpoint just creates the order in payment_status='unpaid'
// (or immediately 'unpaid'/'pending' depending on method) and reserves stock.
async function createOrder(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      customerName, customerEmail, customerPhone,
      shippingAddress, shippingCity, shippingState, shippingPostalCode, shippingCountry,
      paymentMethod,
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !shippingCity) {
      connection.release();
      return res.status(400).json({ message: 'Customer name, email, phone, address and city are required' });
    }
    const method = VALID_PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'cod';

    const [cartRows] = await connection.query(
      `SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.discount_price, p.image_url, p.stock, b.name AS brand_name
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN brands b ON b.id = p.brand_id
       WHERE ci.user_id = ? AND p.status = 'active'`,
      [req.user.id]
    );

    if (!cartRows.length) {
      connection.release();
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    for (const item of cartRows) {
      if (item.stock < item.quantity) {
        connection.release();
        return res.status(400).json({ message: `${item.name} only has ${item.stock} in stock` });
      }
    }

    const effectivePrice = (item) =>
      item.discount_price && Number(item.discount_price) < Number(item.price) ? Number(item.discount_price) : Number(item.price);

    const subtotal = cartRows.reduce((sum, r) => sum + effectivePrice(r) * r.quantity, 0);
    const total = subtotal + SHIPPING_FEE;
    const orderNumber = generateOrderNumber();
    const paymentStatus = method === 'cod' ? 'unpaid' : 'pending';

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (user_id, order_number, customer_name, customer_email, customer_phone, status,
         subtotal, shipping_fee, total, payment_method, payment_status,
         shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, orderNumber, customerName, customerEmail, customerPhone,
        subtotal, SHIPPING_FEE, total, method, paymentStatus,
        shippingAddress, shippingCity, shippingState || null, shippingPostalCode || null, shippingCountry || 'Pakistan',
      ]
    );
    const orderId = orderResult.insertId;

    for (const item of cartRows) {
      const price = effectivePrice(item);
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, brand_name, price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.image_url, item.brand_name, price, item.quantity, price * item.quantity]
      );
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await connection.commit();
    connection.release();

    res.status(201).json({ message: 'Order placed', orderId, orderNumber, total, paymentMethod: method, paymentStatus });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    res.status(500).json({ message: 'Failed to place order' });
  }
}

// GET /api/orders (my orders)
async function getMyOrders(req, res) {
  try {
    const [orders] = await pool.query(
      `SELECT id, order_number, status, subtotal, shipping_fee, total, payment_method, payment_status, created_at
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

// GET /api/orders/:id (my order detail, or any order if admin)
async function getOrderById(req, res) {
  try {
    const isAdmin = req.user.role === 'admin';
    const params = isAdmin ? [req.params.id] : [req.params.id, req.user.id];
    const userClause = isAdmin ? '' : 'AND user_id = ?';

    const [orders] = await pool.query(`SELECT * FROM orders WHERE id = ? ${userClause}`, params);
    if (!orders.length) return res.status(404).json({ message: 'Order not found' });

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ ...orders[0], items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
}

// ---- Admin ----

// GET /api/orders/admin/all
async function getAllOrders(req, res) {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_method, o.payment_status, o.total, o.created_at,
              o.customer_name, o.customer_email
       FROM orders o
       ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

// PUT /api/orders/:id/status  { status }
async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
}

// GET /api/orders/admin/stats — dashboard summary
async function getStats(req, res) {
  try {
    const [[productCount]] = await pool.query("SELECT COUNT(*) AS count FROM products WHERE status = 'active'");
    const [[userCount]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'");
    const [[orderCount]] = await pool.query('SELECT COUNT(*) AS count FROM orders');
    const [[revenue]] = await pool.query(
      "SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE payment_status = 'paid' OR (payment_method = 'cod' AND status != 'cancelled')"
    );
    const [recentOrders] = await pool.query(
      `SELECT id, order_number, status, total, customer_name, created_at FROM orders ORDER BY created_at DESC LIMIT 5`
    );
    res.json({
      productCount: productCount.count,
      userCount: userCount.count,
      orderCount: orderCount.count,
      revenue: Number(revenue.total),
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
}

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, getStats };
