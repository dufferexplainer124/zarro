const pool = require('../config/db');
const paymentService = require('../services/paymentService');

// POST /api/payments/initiate  { orderId, provider, meta }
// `meta` must only contain non-sensitive fields — a client-side card token
// or a wallet phone number. Never send raw card numbers or CVV here.
async function initiate(req, res) {
  try {
    const { orderId, provider, meta } = req.body;
    if (!orderId || !provider) {
      return res.status(400).json({ message: 'orderId and provider are required' });
    }
    if (req.body.cardNumber || req.body.cvv || (meta && (meta.cardNumber || meta.cvv))) {
      return res.status(400).json({ message: 'Raw card numbers and CVV are never accepted by this API' });
    }

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id]);
    if (!orders.length) return res.status(404).json({ message: 'Order not found' });

    const result = await paymentService.initiatePayment({
      orderId,
      provider,
      amount: orders[0].total,
      currency: 'PKR',
      meta: meta || {},
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || 'Failed to initiate payment' });
  }
}

// POST /api/payments/verify  { transactionId }
async function verify(req, res) {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ message: 'transactionId is required' });
    const result = await paymentService.verifyPayment({ transactionId });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || 'Failed to verify payment' });
  }
}

// GET /api/payments/order/:orderId — transaction history for one order
async function getByOrder(req, res) {
  try {
    const isAdmin = req.user.role === 'admin';
    const [orderRows] = await pool.query(
      `SELECT id FROM orders WHERE id = ? ${isAdmin ? '' : 'AND user_id = ?'}`,
      isAdmin ? [req.params.orderId] : [req.params.orderId, req.user.id]
    );
    if (!orderRows.length) return res.status(404).json({ message: 'Order not found' });

    const [rows] = await pool.query(
      'SELECT id, provider, mode, provider_reference, amount, currency, status, created_at FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC',
      [req.params.orderId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
}

module.exports = { initiate, verify, getByOrder };
