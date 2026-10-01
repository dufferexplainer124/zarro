const CardProvider = require('./cardProvider');

class VisaProvider extends CardProvider {
  constructor() {
    super('visa', 'VISA');
  }
}

module.exports = VisaProvider;
