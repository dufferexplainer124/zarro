const pool = require('../config/db');
const VisaProvider = require('./providers/visaProvider');
const MastercardProvider = require('./providers/mastercardProvider');
const EasypaisaProvider = require('./providers/easypaisaProvider');
const JazzcashProvider = require('./providers/jazzcashProvider');

const PROVIDERS = {
  visa: new VisaProvider(),
  mastercard: new MastercardProvider(),
  easypaisa: new EasypaisaProvider(),
  jazzcash: new JazzcashProvider(),
};

const MODE = (process.env.PAYMENTS_MODE || 'test') === 'live' ? 'live' : 'test';

// IMPORTANT: `meta` may only ever contain non-sensitive fields (a client-side
// card token, a wallet phone number, etc). Raw card numbers and CVVs must
// never reach this function — collect and tokenize them entirely on the
// frontend / directly with the gateway's own SDK.
async function initiatePayment({ orderId, provider, amount, currency = 'PKR', meta = {} }) {
  const impl = PROVIDERS[provider];
  if (!impl) throw new Error(`Unsupported payment provider: ${provider}`);

  const result = await impl.initiate({ orderId, amount, currency, meta });

  const [insert] = await pool.query(
    `INSERT INTO payment_transactions (order_id, provider, mode, provider_reference, amount, currency, status, raw_response)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [orderId, provider, MODE, result.reference, amount, currency, result.status, JSON.stringify(result.raw || {})]
  );

  if (result.status === 'succeeded') {
    await pool.query("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [orderId]);
  } else if (result.status === 'pending') {
    await pool.query("UPDATE orders SET payment_status = 'pending' WHERE id = ?", [orderId]);
  } else if (result.status === 'failed') {
    await pool.query("UPDATE orders SET payment_status = 'failed' WHERE id = ?", [orderId]);
  }

  return { transactionId: insert.insertId, ...result };
}

async function verifyPayment({ transactionId }) {
  const [rows] = await pool.query('SELECT * FROM payment_transactions WHERE id = ?', [transactionId]);
  if (!rows.length) throw new Error('Payment transaction not found');
  const tx = rows[0];

  const impl = PROVIDERS[tx.provider];
  const result = await impl.verify({ reference: tx.provider_reference });

  await pool.query(
    'UPDATE payment_transactions SET status = ?, raw_response = ? WHERE id = ?',
    [result.status, JSON.stringify(result.raw || {}), transactionId]
  );

  const paymentStatus = result.status === 'succeeded' ? 'paid' : result.status === 'failed' ? 'failed' : 'pending';
  await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, tx.order_id]);

  return { transactionId, ...result };
}

module.exports = { initiatePayment, verifyPayment, PROVIDERS: Object.keys(PROVIDERS), MODE };
