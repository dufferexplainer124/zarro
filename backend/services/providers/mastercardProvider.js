const CardProvider = require('./cardProvider');

class MastercardProvider extends CardProvider {
  constructor() {
    super('mastercard', 'MASTERCARD');
  }
}

module.exports = MastercardProvider;
