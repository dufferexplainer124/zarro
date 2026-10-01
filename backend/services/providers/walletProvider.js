const crypto = require('crypto');
const BaseProvider = require('./baseProvider');

// Shared mock logic for local mobile-wallet gateways (EasyPaisa, JazzCash).
// Real integrations for these typically redirect the customer to a hosted
// page or send an OTP to their wallet-linked phone number, then confirm via
// a server-to-server callback/webhook — they do not involve card numbers.
class WalletProvider extends BaseProvider {
  constructor(name, envPrefix) {
    super(name);
    this.merchantId = process.env[`${envPrefix}_MERCHANT_ID`] || null;
    this.apiKey = process.env[`${envPrefix}_API_KEY`] || null;
    this.mock = (process.env.PAYMENTS_MODE || 'test') !== 'live';
  }

  async initiate({ orderId, amount, currency, meta = {} }) {
    if (!meta.walletPhone) {
      throw new Error(`${this.name}: a wallet phone number is required`);
    }

    if (this.mock) {
      await new Promise((r) => setTimeout(r, 150));
      const reference = `MOCK-${this.name.toUpperCase()}-${crypto.randomBytes(6).toString('hex')}`;
      return {
        reference,
        status: 'pending', // real flow: pending until the customer confirms on their phone
        redirectUrl: null,
        raw: { mock: true, provider: this.name, orderId, amount, currency, walletPhone: meta.walletPhone },
      };
    }

    // ---- Live mode placeholder ----
    // Replace with a real call to the EasyPaisa/JazzCash merchant API using
    // this.merchantId / this.apiKey, then handle their confirmation webhook.
    throw new Error(`${this.name}: live mode is not configured yet — set PAYMENTS_MODE=test until real API keys are added`);
  }

  async verify({ reference }) {
    if (this.mock) {
      // In mock mode, treat any previously-initiated payment as confirmed
      // once verify() is called (simulates the customer approving on-device).
      return { reference, status: 'succeeded', raw: { mock: true } };
    }
    throw new Error(`${this.name}: live verify() is not configured yet`);
  }
}

module.exports = WalletProvider;
