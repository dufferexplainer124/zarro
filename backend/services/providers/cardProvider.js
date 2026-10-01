const crypto = require('crypto');
const BaseProvider = require('./baseProvider');

// Shared mock logic for card networks (Visa, Mastercard). A real integration
// would call the acquirer/processor's API (e.g. Stripe, HBL, or a local PSP)
// using a CLIENT-SIDE TOKEN — this backend must never see a raw card number
// or CVV. In mock mode we just simulate a gateway accepting a token and
// returning a reference.
class CardProvider extends BaseProvider {
  constructor(name, envPrefix) {
    super(name);
    this.apiKey = process.env[`${envPrefix}_API_KEY`] || null;
    this.apiSecret = process.env[`${envPrefix}_API_SECRET`] || null;
    this.mock = (process.env.PAYMENTS_MODE || 'test') !== 'live';
  }

  async initiate({ orderId, amount, currency, meta = {} }) {
    if (meta.cardNumber || meta.cvv) {
      // Defensive check: this backend must never receive raw card data.
      throw new Error('Raw card details must not be sent to the server — use a client-side token instead');
    }

    if (this.mock) {
      // Simulate network latency + a gateway reference.
      await new Promise((r) => setTimeout(r, 150));
      const reference = `MOCK-${this.name.toUpperCase()}-${crypto.randomBytes(6).toString('hex')}`;
      return {
        reference,
        status: 'succeeded', // mock mode auto-approves so checkout flows can be tested end-to-end
        raw: { mock: true, provider: this.name, orderId, amount, currency },
      };
    }

    // ---- Live mode placeholder ----
    // Replace with a real call to the processor's server-side API using
    // meta.cardToken (never a raw PAN/CVV) and this.apiKey / this.apiSecret.
    throw new Error(`${this.name}: live mode is not configured yet — set PAYMENTS_MODE=test until real API keys are added`);
  }

  async verify({ reference }) {
    if (this.mock) {
      return { reference, status: 'succeeded', raw: { mock: true } };
    }
    throw new Error(`${this.name}: live verify() is not configured yet`);
  }
}

module.exports = CardProvider;
