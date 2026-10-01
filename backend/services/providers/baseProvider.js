// Common interface every payment provider must implement.
// A real integration replaces the body of these methods with actual gateway
// calls; the mock implementation below simulates a gateway round trip so the
// rest of the app (orders, checkout, admin) can be built and tested today.
class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  // Starts a payment. Returns { reference, status, redirectUrl?, raw }.
  // Never receives or persists raw card numbers/CVV — see cardTokenizer note
  // in paymentService.js.
  // eslint-disable-next-line no-unused-vars
  async initiate({ orderId, amount, currency, meta }) {
    throw new Error(`${this.name}: initiate() not implemented`);
  }

  // Confirms/polls a payment's current status with the gateway.
  // eslint-disable-next-line no-unused-vars
  async verify({ reference }) {
    throw new Error(`${this.name}: verify() not implemented`);
  }
}

module.exports = BaseProvider;
