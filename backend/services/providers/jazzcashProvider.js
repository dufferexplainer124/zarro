const WalletProvider = require('./walletProvider');

class JazzcashProvider extends WalletProvider {
  constructor() {
    super('jazzcash', 'JAZZCASH');
  }
}

module.exports = JazzcashProvider;
