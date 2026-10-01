const WalletProvider = require('./walletProvider');

class EasypaisaProvider extends WalletProvider {
  constructor() {
    super('easypaisa', 'EASYPAISA');
  }
}

module.exports = EasypaisaProvider;
