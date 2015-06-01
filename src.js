// todo add docstrings
var alice = new Client('alice'); // todo remove these
var bob = new Client('bob');
var carl = new Client('carl');
var clients = [alice, bob, carl];

/*
 * DO NOT EDIT
 */
function Client (id){
  this.id = id; // id == public key == address
  this.unusedValidTransactions = {}; // blockchain, contains SHAs // todo convert to array?
  this.unvalidatedTransactions = []; // need to validate these.
};
/*
 * PLEASE EDIT
 */
Client.prototype.give = function(destinationId, amount) {
  var thisClient = this;
  var transaction = new Transaction(thisClient);
  // add all possible input transactions
  arrayify(thisClient.unusedValidTransactions).forEach(function(inputTransaction){
    if(inputTransaction.sumToDestination(thisClient.id)){
      transaction.addInput(inputTransaction); // todo what if sender not named in input txn?
    }
  });
  // add destination and amount
  transaction.addOutput(destinationId, amount);
  // send rest of input amount back to self
  transaction.addOutput(thisClient.id, thisClient.balance() - amount);
  thisClient.broadcastTransaction(transaction);
  return transaction;

  // helper (DO NOT EDIT)
  function arrayify(obj){
    return Object.keys(obj).reduce(function(result, key){
      result.push(obj[key]);
      return result;
    }, []);
  }
};
/*
 * PLEASE EDIT
 */
Client.prototype.broadcastTransaction = function(transaction){
  var thisClient = this;
  console.log(thisClient.id,'broadcasts transaction', transaction);
  clients.forEach(function(client){
    client.onReceivingTransaction(transaction, thisClient.id);
  });
};
/*
 * PLEASE EDIT
 * dependencies: Client.prototype.verify
 */
Client.prototype.onReceivingTransaction = function(transaction, senderId){
  if(this.verify(transaction)){
    console.log(this.id,'accepts transaction',transaction.id,'from',senderId);
    this.unvalidatedTransactions.push(transaction);
  } else {
    console.log(this.id,'rejects transaction',transaction.id,'from',senderId);
  }
};
/*
 * PLEASE EDIT
 * dependencies: Client.prototype.validateSolution
 */
Client.prototype.mine = function(){
  var thisClient = this;
  var solution = 1;
  while(!thisClient.validateSolution(solution)){
    solution = Math.random();
  }
  thisClient.broadcastSolution(solution, thisClient.unvalidatedTransactions);
  return solution;
};
/*
 * PLEASE EDIT
 */
Client.prototype.broadcastSolution = function(solution, transactions){
  var thisClient = this;
  console.log(thisClient.id,'broadcasts solution',solution,'to validate transactions', transactions);
  clients.forEach(function(client){
    client.onReceivingSolution(solution, transactions.slice(), thisClient.id); // slice to copy
  });
};
/*
 * PLEASE EDIT
 */
Client.prototype.onReceivingSolution = function(solution, transactions, solverId){
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

  // helpers (DO NOT EDIT)
  function verifyAll(transactions){
    return transactions.reduce(function(transactionsValid, transaction){
      return transactionsValid && thisClient.verify(transaction);
    }, true);
  }
  function updateBlockchain(transactions){
    transactions.forEach(function(transaction){
      deleteUsedInputTransactions(transaction) // todo other dest?
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
/*
 * PLEASE EDIT
 */
Client.prototype.balance = function(){
  var thisClient = this;
  var transactions = thisClient.unusedValidTransactions;
  return Object.keys(transactions).reduce(function(sum, transactionId){
    var transaction = transactions[transactionId];
    return sum += transaction.sumToDestination(thisClient.id);
  }, 0);
};
/*
 * PLEASE EDIT
 */
Client.prototype.verify = function(transaction){
  // each input must be valid, unused, and name the sender as a destination
  var inputsValid = transaction.inputsValid(this.unusedValidTransactions)
  var outputsValid = transaction.outputsValid();
  return inputsValid && outputsValid;
};
/*
 * DO NOT EDIT
 */
Client.prototype.validateSolution = function(solution){
  return solution < 0.2;
  //
};
/*
 * DO NOT EDIT
 */
Client.prototype.generateRewardTransaction = function(solution, id, amount){
  var txn = new Transaction('coinbase', 'reward'+solution); // same SHA for a given solution
  txn.addOutput(id, amount);
  return txn;
};

/*
 * DO NOT EDIT any of the Transaction methods.
 */
function Transaction(sender){
  this.sender = sender;
  this.id = 'transfer'+Math.random();
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
Transaction.prototype.outputsValid = function(){
  var outputsSum = this.outputs.reduce(function(sum, output){
    return sum += output.amount;
  }, 0);
  return this.inputsSumToSender(this.sender.id) - outputsSum >= 0;
  // todo make === not >= ; difference would be fee to miner
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
Transaction.prototype.inputsSumToSender = function(clientId){
  return this.inputs.reduce(function(sum, inputTransaction){
    return sum += inputTransaction.sumToDestination(clientId);
  }, 0);
};
Transaction.prototype.sumToDestination = function(clientId){
  return this.outputs.reduce(function(sum, output){
    return sum += output.destination === clientId ? output.amount : 0;
  }, 0);
};

// var initialTxn = alice.generateRewardTransaction(0, 'alice', 10); // how does this really happen?
// alice.unusedValidTransactions[initialTxn.id] = initialTxn;
// bob.unusedValidTransactions[initialTxn.id] = initialTxn;
// carl.unusedValidTransactions[initialTxn.id] = initialTxn;
// console.log('alice given initial amount 10 via',initialTxn.id);

// alice.give('bob', 1);
// alice.give('carl', 2);
// alice.give('alice', 3);
// carl.mine();
