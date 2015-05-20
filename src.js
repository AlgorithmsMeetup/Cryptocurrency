// Wallet
theBlockchain = []
alice = new Wallet(theBlockchain, 10)
bob = new Wallet(theBlockchain, 2)
carl = new Wallet(theBlockchain)

// Transactions
alice.give(bob.address, 1) // coin should have id

// Mining (AKA transaction validation)

Wallet = function(theBlockchain, initialBalance){
  this.balance = initialBalance || 0
  this.validTransactions = theBlockchain // a copy of the Blockchain
  this.unvalidatedTransactions = []
  this.connection = new Socket() // new websocket connection for .on & .broadcast

  this.connection.on('transaction', function(message){
    if(verifyTransaction(message.transaction, message.senderPublicKey)){
      unvalidatedTransactions.push(message.transaction)
    }
    if(unvalidatedTransactions.length > 0){
      proofOfWork = carl.validateTransactions(transactions, carl.blockchain)
      this.connection.broadcast('proofOfWork', proofOfWork)
    }
  });

  this.connection.on('proofOfWork', function(solution){
    if(verifyProofOfWork(solution.nonce)){
      this.validTransactions.push(solution.transactions)
      // remove unvalidatedTransactions that have now been validated
    } // else was not a valid solution; disregard.
  })
}

Wallet.prototype.give = function(recipientAddress, amount) {
  nakedtransaction = {sender:this.address, receiver:recipientAddress, amount:amount}
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
