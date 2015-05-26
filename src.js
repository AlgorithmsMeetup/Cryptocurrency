var wallets = [];
Wallet = function(genesisBlock){
  this.balance = 0;
  this.validTransactions = ['genesisBlock'] // aka blockchain
  this.unvalidatedTransactions = []
  // add self to global wallets for broadcasting purposes
  wallets.push(this);
}

Wallet.prototype.receiveTransaction = function(signedTransactionId, sender.publicKey){
    if(verifyTransaction(message.transaction, message.senderPublicKey)){
      unvalidatedTransactions.push(message.transaction)
    }
    if(unvalidatedTransactions.length > 0){
      proofOfWork = carl.validateTransactions(transactions, carl.blockchain)
      this.connection.broadcast('proofOfWork', proofOfWork)
    }
  });

Wallet.prototype.broadcastTransaction = function(transaction, this.publicKey){
Wallet.prototype.broadcastSolution = function(solution){



Wallet.prototype.give = function(destination, amount) {
  nakedtransaction = {sender:this.publicKey, receiver:destination, amount:amount}
  signedTransaction = this.sign(nakedtransaction)
  this.connection.broadcast('transaction', {transaction:signedTransaction, senderPublicKey:this.publicKey)
};
Wallet.prototype.sign = function(nakedtransaction) {
  return this.publicKey+JSON.stringify(nakedtransaction)
}

Wallet.prototype.validateTransactions = function() {
  solution = {nonce:0, transactions:this.unvalidatedTransactions}
  while(!verifyProofOfWork(soution.nonce) && soution.transactions.length > 0){
    solution.nonce = Math.random()
  }
  this.connection.broadcast('proofOfWork',solution)
};

function verifyTransaction(signedTransaction, senderPublicKey) {} //return Boolean

function verifyProofOfWork(solution){} // return Boolean
