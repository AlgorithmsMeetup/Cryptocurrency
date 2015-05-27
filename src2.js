var alice = new Client('alice');
var bob = new Client('bob');
var carl = new Client('carl');
var clients = [alice, bob, carl];

function Client (id){
  this.id = id; // id == public key == address
  this.unusedValidTransactions = {}; // blockchain, contains SHAs
  this.unvalidatedTransactions = []; // need to validate these.
};
Client.prototype.give = function(destinationId, amount) {
  var thisClient = this;
  var transaction = new Transaction(thisClient, 'transfer'+Math.random()); // todo SHA
  // add all possible input transactions
  arrayify(thisClient.unusedValidTransactions).forEach(function(inputTransaction){
    transaction.addInput(inputTransaction);
  });
  // add destination and amount
  transaction.addOutput(destinationId, amount);
  // send rest of input amount back to self
  transaction.addOutput(thisClient.id, thisClient.balance() - amount);
  thisClient.broadcastTransaction(transaction);
  return transaction;

  function arrayify(obj){
    return Object.keys(obj).reduce(function(result, key){
      result.push(obj[key]);
      return result;
    }, []);
  }
};
Client.prototype.balance = function(){
  var thisClient = this;
  var transactions = thisClient.unusedValidTransactions;
  return Object.keys(transactions).reduce(function(sum, transactionId){
    var transaction = transactions[transactionId];
    return sum += transaction.sumToDestination(thisClient.id);
  }, 0);
};
Client.prototype.broadcastTransaction = function(transaction){
  var thisClient = this;
  console.log(thisClient.id,'broadcasts transaction', transaction);
  clients.forEach(function(client){
    client.onTransactionBroadcast(transaction, thisClient.id);
  });
};
Client.prototype.onTransactionBroadcast = function(transaction, senderId){
  if(this.verify(transaction)){
    console.log(this.id,'accepts transaction',transaction.id,'from',senderId);
    //todo add to list of transactions being validated
    this.unvalidatedTransactions.push(transaction);
  } else {
    console.log(this.id,'rejects transaction',transaction.id,'from',senderId);
  }
};
Client.prototype.mine = function(){
  var thisClient = this;
  var solution = 1;
  while(!thisClient.validateSolution(solution)){
    solution = Math.random();
  }
  // solution found
  thisClient.broadcastSolution(solution, thisClient.unvalidatedTransactions);
  return solution;
};
Client.prototype.broadcastSolution = function(solution, transactions){
  var thisClient = this;
  console.log(thisClient.id,'broadcasts solution',solution,'to validate transactions', thisClient.unvalidatedTransactions);
  clients.forEach(function(client){
    client.onSolutionBroadcast(solution, thisClient.unvalidatedTransactions.slice(), thisClient.id); // slice to copy
  });
};
Client.prototype.onSolutionBroadcast = function(solution, transactions, solverId){
  var thisClient = this;
  var areAllTransactionsValid = verifyAll(transactions);
  if( thisClient.validateSolution(solution) && areAllTransactionsValid ){
    console.log(this.id,'accepts solution',solution,'from',solverId);
    var rewardTxn = thisClient.generateRewardTransaction(solution, solverId, 10); // creates a transaction
    transactions.push(rewardTxn);
    updateBlockchain(transactions);
  } else {
    console.log(this.id,'rejects solution',solution,'from',solverId);
  }

  // helpers
  function verifyAll(transactions){
    return transactions.reduce(function(transactionsValid, transaction){
      return transactionsValid && thisClient.verify(transaction);
    }, true);
  }
  function updateBlockchain(transactions){
    transactions.forEach(function(transaction){
      deleteUsedInputTransactions(transaction)
      thisClient.unusedValidTransactions[transaction.id] = transaction;
      // clear txn from unvalidatedTransactions
      var i = thisClient.unvalidatedTransactions.indexOf(transaction);
      if(i >= 0){
        thisClient.unvalidatedTransactions.splice(i, 1);
      }
    });
    function deleteUsedInputTransactions(transaction){
      transaction.inputs.forEach(function(inputTransaction){
        delete thisClient.unusedValidTransactions[inputTransaction.id];
      });
    }
  }
};
Client.prototype.validateSolution = function(solution){
  return solution < 0.1;
  // todo
};
// can use a txn if it's never been an input to another transaction in the blockchain
Client.prototype.verify = function(transaction){
  // each input must be valid, unused, and name the sender as a destination
  return transaction.inputsValid(this.unusedValidTransactions) && transaction.outputsValid();
}
Client.prototype.generateRewardTransaction = function(solution, id, amount){
  var txn = new Transaction('coinbase', 'reward'+solution); // same SHA for a given solution
  txn.addOutput(id, amount);
  return txn;
};

function Transaction(sender, sha){
  this.sender = sender; // todo or client.id and lookup in clients hash?
  this.id = sha;
  this.inputs = [];
  this.outputs = [];
}
Transaction.prototype.addInput = function(inputTransaction){ //should be valid and unused
  this.inputs.push(inputTransaction);
  //
};
Transaction.prototype.addOutput = function(publicKey, amount){
  this.outputs.push({amount:amount, destination:publicKey}); // destination can be self
  //
};
// txn verification helper functions
Transaction.prototype.sumToDestination = function(clientId){
  return this.outputs.reduce(function(sum, output){
    return sum += output.destination === clientId ? output.amount : 0;
  }, 0);
};
Transaction.prototype.inputsSumToSender = function(publicKey){
  return this.inputs.reduce(function(sum, inputTransaction){
    return sum += inputTransaction.sumToDestination(publicKey);
  }, 0);
};
Transaction.prototype.inputsValid = function(unusedValidTransactions){
  var sender = this.sender;
  // for each input
  return this.inputs.reduce(function(isValid, inputTransaction){
    return isValid
      // input transaction is valid and hasn't been used to source another txn yet
      && unusedValidTransactions[inputTransaction.id]
      // input transactions sent > 0 coins to sender
      && inputTransaction.sumToDestination(sender.id) > 0;
  }, true);
};
Transaction.prototype.outputsValid = function(){
  var outputsSum = this.outputs.reduce(function(sum, output){
    return sum += output.amount;
  }, 0);
  return this.inputsSumToSender(this.sender.id) - outputsSum >= 0; // difference would be fee to miner
};

var initialTxn = alice.generateRewardTransaction(0, 'alice', 10);
alice.unusedValidTransactions[initialTxn.id] = initialTxn;
bob.unusedValidTransactions[initialTxn.id] = initialTxn;
carl.unusedValidTransactions[initialTxn.id] = initialTxn;
console.log('alice given initial amount 10 via',initialTxn.id);

alice.give('bob', 1);
alice.give('carl', 2);
alice.give('alice', 3);
carl.mine();
