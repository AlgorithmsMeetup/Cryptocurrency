var expect = chai.expect;

describe('Client', function(){
  context('.balance', function(){
    it('calculates available balance that can be spent', function(){
      var client1 = new Client('client1');
      expect(client1.balance()).to.equal(0);

      var txn = client1.generateRewardTransaction(0, 'client1', 6);
      client1.unusedValidTransactions[txn.id] = txn;

      expect(client1.balance()).to.equal(6);
    });
    it('only includes amount to self', function(){
      var client1 = new Client('client1');

      var txn1 = new Transaction('coinbase', 'txn1');
      txn1.addOutput('client1', 1);
      txn1.addOutput('other', 2);
      client1.unusedValidTransactions[txn1.id] = txn1;
      var txn2 = new Transaction('coinbase', 'txn2');
      txn2.addOutput('other', 5);
      client1.unusedValidTransactions[txn2.id] = txn2;

      expect(client1.balance()).to.equal(1);
    });
  });
  context('.give', function(){
    it('creates a transaction to give an amount to other clients', function(){
      var client1 = new Client('client1');
      var txn = client1.give('client2', 4);
      expect(txn.sender).to.deep.equal(client1);
      expect(txn.inputs).to.not.equal(undefined);
      expect(txn.outputs).to.not.equal(undefined);
    });
    it('uses all transactions that gave this client an amount as inputs to new transaction', function(){
      var client1 = new Client('client1');
      var txn1 = new Transaction('coinbase', 'txn1');
      txn1.addOutput('client1', 5);
      client1.unusedValidTransactions[txn1.id] = txn1;

      var txn2 = new Transaction('coinbase', 'txn2');
      txn2.addOutput('other', 4);
      client1.unusedValidTransactions[txn2.id] = txn2;

      var txn = client1.give('client2', 3);

      expect(txn.inputs).to.deep.equal([txn1]);
      expect(txn.inputs).to.not.deep.equal(client1.unusedValidTransactions);
    });
    it('lists destination and amount as an output to new transaction', function(){
      var client1 = new Client('client1');
      var txn = client1.give('client2', 4);
      expect(txn.outputs[0]).to.deep.equal({amount: 4, destination: 'client2'});
    });
    it('lists self and amount not sent to destination as an output to new transaction', function(){
      var client1 = new Client('client1');

      var initialTxn = new Transaction('coinbase', 'initialTxn');
      initialTxn.addOutput('client1', 10);
      client1.unusedValidTransactions[initialTxn.id] = initialTxn;

      var txn = client1.give('client2', 4);
      console.log(txn.outputs);
      expect(txn.outputs[1]).to.deep.equal({amount: 6, destination: 'client1'});
    });
    it('broadcasts the new transaction', function(){
      var calledWithArguments;
      Client.prototype.broadcastTransaction = function(){
        calledWithArguments = arguments[0];
      };

      var client1 = new Client('client1');
      var txn = client1.give('client2', 4);

      expect(calledWithArguments).to.deep.equal(txn);
    });
  });
  context('.broadcastTransaction', function(){
    xit('passes the new transaction to other clients', function(){});
    xit('passes own id to other clients', function(){});
  });
  context('.onReceivingTransaction', function(){
    xit('stores new transaction if valid', function(){});
    xit('does not store new transaction if invalid', function(){});
  });

  context('Client validates transactions by mining', function(){
    xit('verifies transactions', function(){});
    xit('can solve the proof-of-work problem', function(){});
    xit('broadcasts proof-of-work solution when found', function(){});
    xit('verifies received proof-of-work', function(){});
    xit('updates its copy of the blockchain upon receiving valid proof-of-work', function(){});
  });

  context('Client scenarios', function(){
    xit('can give an amount to another client', function(){});
    xit('cannot double-spend', function(){});
    xit('handles receiving concurrent solutions', function(){});
    xit('validates another proof-of-work solution', function(){});
  });
});

describe('Transaction', function(){
  xit('uses previous transactions as inputs', function(){});
  xit('has a list of destination/amounts as outputs', function(){});
  xit('has a unique id', function(){});
  xit('knows who created the transaction', function(){});
});
