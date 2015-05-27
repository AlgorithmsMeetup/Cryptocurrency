var alice = new Client('alice');
var bob = new Client('bob');
var carl = new Client('carl');
var clients = [alice, bob, carl];


// OR
// var clients = {};
// var alice = new Client('alice');
// clients[alice.id] = alice;
// var bob = new Client('bob');
// clients[bob.id] = bob;
// var carl = new Client('carl');
// clients[carl.id] = carl;

function Client (id){
  this.id = id; // id == public key == address
  this.unusedValidTransactions = {}; // blockchain, contains SHAs
};

function arrayify(obj){
  return Object.keys(obj).reduce(function(result, key){
    result.push(obj[key]);
    return result;
  }, []);
}

Client.prototype.give = function(destinationId, amount) {
  var thisClient = this;
  var transaction = new Transaction(thisClient, 'a SHA'+Math.random()); // todo SHA
  // add all possible input transactions
  arrayify(thisClient.unusedValidTransactions).forEach(function(inputTransaction){
    transaction.addInput(inputTransaction);
  });
  // add destination and amount
  transaction.addOutput(destinationId, amount);
  // send rest of input amount back to self
  transaction.addOutput(thisClient.id, thisClient.calculateBalance() - amount);
  thisClient.broadcastTransaction(transaction);
  return transaction;
};
Client.prototype.calculateBalance = function(){
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
  if(this.validate(transaction)){
    console.log(this.id,'accepts transaction',transaction.id,'from',senderId);
    //todo add to list of transactions being validated
  } else {
    console.log(this.id,'rejects transaction',transaction.id,'from',senderId);
  }
};

Client.prototype.broadcastSolution = function(solution){
  var thisClient = this;
  clients.forEach(function(client){
    client.onSolutionBroadcast(solution, transactions, thisClient.id);
  });
};
Client.prototype.onBroadcastSolution = function(solution, transactions, solverId){
  var thisClient = this;
  if( verify(solution) && validateAll(transactions) ){
    var rewardTxn = generateRewardTransaction(solverId, 10); // creates a transaction
    transactions[rewardTxn.id] = rewardTxn;
    updateBlockchain(transactions);
  }

  // helpers
  function verify(solution){
    return solution % 2 === 0;
    // todo
  };
  function validateAll(transactions){
    return transactions.reduce(function(transactionsValid, transaction){
      return transactionsValid && thisClient.validate(transaction);
    }, true);
  }
  function updateBlockchain(transactions){
    transactions.forEach(function(transaction){
      deleteUsedInputTransactions(transaction)
      thisClient.unusedValidTransactions[transaction.id] = transaction;
    });
    function deleteUsedInputTransactions(transaction){
      transaction.inputs.forEach(function(inputTransaction){
        delete thisClient.unusedValidTransactions[inputTransaction.id];
      });
    }
  }
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

// can use a txn if it's never been an input to another transaction in the blockchain
Client.prototype.validate = function(transaction){
  // each input must be valid, unused, and name the sender as a destination
  return transaction.inputsValid(this.unusedValidTransactions) && transaction.outputsValid();
}

function generateRewardTransaction(id, amount){
  var txn = new Transaction('coinbase', 'reward SHA');
  txn.addOutput(id, amount);
  return txn;
}


var initialTxn = generateRewardTransaction('alice', 10);
alice.unusedValidTransactions[initialTxn.id] = initialTxn;
bob.unusedValidTransactions[initialTxn.id] = initialTxn;
carl.unusedValidTransactions[initialTxn.id] = initialTxn;

var x = alice.give('bob', 1)
