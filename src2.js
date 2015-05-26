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

Client.prototype.give = function(destinationId, amount) {
  var thisClient = this;
  var transaction = new Transaction(thisClient, 'a SHA'); // todo SHA
  var possibleInputTransactions = thisClient.unusedValidTransactions.filter(function(txn){
    return txn.sender === thisClient.id;
  });
  // add all possible input transactions
  possibleInputTransactions.forEach(function(inputTransaction){
    transaction.addInput(inputTransaction);
  });
  // add destination and amount
  transaction.addOutput(destinationId, amount);
  // send rest of input amount back to self
  var inputsSum = inputsSumToSender(thisClient.id);
  transaction.addOutput(thisClient.id, inputsSum - amount);
  thisClient.broadcastTransaction(txn);
};

Client.prototype.broadcastTransaction = function(transaction){
  var thisClient = this;
  clients.forEach(function(client){
    client.onTransactionBroadcast(transaction, thisClient.id);
  });
};
Client.prototype.onTransactionBroadcast = function(transaction, sender){
  // todo
}

Client.prototype.broadcastSolution = function(solution){
  var thisClient = this;
  clients.forEach(function(client){
    client.onSolutionBroadcast(solution, thisClient.id);
  });
};
Client.prototype.onBroadcastSolution = function(solution, transactions, solverId){
  var thisClient = this;
  if( verify(solution) && validateAll(transactions) ){
    transactions.push(generateRewardTransaction(solverId, 10)); // creates a transaction
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

var Transaction = function(sender, sha){
  this.sender = sender; // todo or client.id and lookup in clients hash?
  this.id = sha;
  this.inputs = [];
  this.outputs = [];
};
Transaction.prototype.addInput = function(inputTransaction){ //should be valid and unused
  this.inputs.push(inputTransactionId);
  //
};
Transaction.prototype.addOutput = function(publicKey, amount){
  this.outputs.push({amount:amount, destination:publicKey}); // destination can be self
  //
};

// txn verification helper functions
Transaction.prototype.sumToDestination = function(clientId){
  return this.outputs.reduce(function(sum, output){
    return sum + output.destination === clientId ? output.amount : 0;
  }, 0);
};
Transaction.prototype.inputsSumToSender = function(publicKey){
  return this.inputs.reduce(function(sum, inputTransaction){
    return sum + inputTransaction.sumToDestination(publicKey);
  }, 0);
};
Transaction.prototype.inputsValid = function(unusedValidTransactions){
  var sender = this.sender;
  // for each input
  return this.inputs.reduce(function(isValid, inputTransaction){
    return isValid
      // input transaction is valid and hasn't been used to source another txn yet
      && ~unusedValidTransactions.indexOf(inputTransaction)
      // input transactions sent > 0 coins to sender
      && inputTransaction.inputsSumToSender(sender) > 0;
  }, true);
};
Transaction.prototype.outputsValid = function(){
  var outputsSum = this.outputs.reduce(function(sum, output){
    return sum + output.amount;
  }, 0);
  return this.inputsSumToSender() - outputsSum > 0; // difference would be fee to miner
};

// can use a txn if it's never been an input to another transaction in the blockchain
Client.validateTransaction = function(transaction){
  // each input must be valid, unused, and name the sender as a destination
  return transaction.inputsValid(this.unusedValidTransactions) && transactions.outputsValid();
}
