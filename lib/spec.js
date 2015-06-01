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
      var giftTxn = client1.give('client2', 3);

      expect(giftTxn.inputs).to.deep.equal([txn1]);
      expect(giftTxn.inputs).to.not.deep.equal(client1.unusedValidTransactions);
    });
    it('lists destination and amount as an output to new transaction', function(){
      var client1 = new Client('client1');
      var txn = client1.give('client2', 4);
      expect(txn.outputs[0]).to.deep.equal({amount: 4, destination: 'client2'});
    });
    it('lists self and amount not sent to destination as an output to new transaction', function(){
      var stub = sinon.stub(Client.prototype, 'balance', function(){ return 10; });
      var client1 = new Client('client1');

      var initialTxn = new Transaction('coinbase', 'initialTxn');
      initialTxn.addOutput('client1', 10);
      client1.unusedValidTransactions[initialTxn.id] = initialTxn;

      var txn = client1.give('client2', 4);
      expect(txn.outputs[1]).to.deep.equal({amount: 6, destination: 'client1'});
      stub.restore();
    });
    it('broadcasts the new transaction', function(){
      // setup
      var spy = sinon.spy(Client.prototype, 'broadcastTransaction');
      // test
      var client1 = new Client('client1');
      var txn = client1.give('client2', 4);
      expect(spy.calledWith(txn)).to.be.true;
      // teardown
      Client.prototype.broadcastTransaction.restore();
    });
  });

  context('.broadcastTransaction', function(){
    it('passes the new transaction to other clients', function(){
      // setup
      var spy = sinon.spy(Client.prototype, "onReceivingTransaction");
      var client1 = new Client('client1');
      var clients = [client1];
      var txn = new Transaction('txn');
      // test
      client1.broadcastTransaction(txn);
      expect(spy.calledWith(txn)).to.be.true;
      // teardown
      Client.prototype.onReceivingTransaction.restore();
    });
    xit('passes copy, not original new transaction');
    it('passes own id to other clients', function(){
      // setup
      var spy = sinon.spy(Client.prototype, "onReceivingTransaction");
      var client1 = new Client('client1');
      var clients = [client1];
      var txn = new Transaction(client1);
      // test
      client1.broadcastTransaction(txn);
      expect(spy.args[0][1]).to.equal(client1.id);
      // teardown
      Client.prototype.onReceivingTransaction.restore();
    });
  });

  context('.onReceivingTransaction', function(){
    it('stores new transaction if valid', function(){
      var stub = sinon.stub(Client.prototype, 'verify', function(){ return true; });
      var client1 = new Client('client1');
      var initialTxn = new Transaction('coinbase');
      initialTxn.addOutput('client1', 7);
      client1.unusedValidTransactions[initialTxn.id] = initialTxn;
      var validTxn = new Transaction(client1);
      validTxn.addInput(initialTxn);
      validTxn.addOutput('client1', 7);

      client1.onReceivingTransaction(validTxn, 'client1')
      expect(client1.unvalidatedTransactions).to.deep.equal([validTxn]);
      stub.restore();
    });
    it('does not store new transaction if invalid', function(){
      var stub = sinon.stub(Client.prototype, 'verify', function(){ return false; });
      var invalidTxn = new Transaction('invalid');
      invalidTxn.addOutput('otherClient', 10);
      var client1 = new Client('client1');
      client1.onReceivingTransaction(invalidTxn, 'client1')
      expect(client1.unvalidatedTransactions).to.deep.equal([]);
      stub.restore();
    });
  });

  context('.verify transaction', function(){
    it('returns true for valid transactions', function(){
      var client1 = new Client('client1');
      var initialTxn = new Transaction('coinbase');
      initialTxn.addOutput('client1', 7);
      client1.unusedValidTransactions[initialTxn.id] = initialTxn;

      var validTxn = new Transaction(client1);
      validTxn.addInput(initialTxn);
      validTxn.addOutput('client1', 7);
      expect(client1.verify(validTxn)).to.be.true;
    });
    it('returns false for invalid transactions', function(){
      var client1 = new Client('client1');
      var invalidTxn = new Transaction('invalid');
      invalidTxn.addOutput('overspend', 1);
      expect(client1.verify(invalidTxn)).to.be.false;
    });
  });

  context('.mine finds and broadcasts a solution to the proof-of-work problem', function(){
    it('solves the proof-of-work problem', function(){
      var client1 = new Client('client1');
      var solution = client1.mine();
      expect(client1.validateSolution(solution)).to.be.true;
    });
    it('broadcasts proof-of-work solution when found', function(){
      // setup
      var realFunc = Client.prototype.broadcastSolution;
      var calledWithArguments;
      Client.prototype.broadcastSolution = function(){
        calledWithArguments = arguments;
      };
      // test
      var client1 = new Client('client1');
      var txns = ['some','unvalidated','transactions'];
      client1.unvalidatedTransactions = txns;
      var solution = client1.mine();
      expect(calledWithArguments[0]).to.equal(solution);
      expect(calledWithArguments[1]).to.equal(txns);
      // teardown
      Client.prototype.broadcastSolution = realFunc;
    });
  });

  context('.broadcastSolution broadcasts a solution and a list of transactions', function(){
    it('broadcasts solution and unvalidated transactions to clients', function(){
      // setup
      var realFunc = Client.prototype.onReceivingSolution;
      var calledWithArguments;
      Client.prototype.onReceivingSolution = function(){
        calledWithArguments = arguments;
      };
      // test
      var client1 = new Client('client1');
      var txns = ['some','unvalidated','transactions'];
      client1.broadcastSolution(0.15, txns)
      expect(calledWithArguments[0]).to.equal(0.15);
      expect(calledWithArguments[1]).to.deep.equal(txns);
      // teardown
      Client.prototype.onReceivingSolution = realFunc;
    });
    it('sends a copy of the transactions, not the originals', function(){
      // setup
      var realFunc = Client.prototype.onReceivingSolution;
      var calledWithArguments;
      Client.prototype.onReceivingSolution = function(){
        calledWithArguments = arguments;
      };
      // test
      var client1 = new Client('client1');
      var txns = ['original','unvalidated','transactions'];
      client1.broadcastSolution(0.15, txns)
      txns = ['original','unvalidated','transactions'];
      expect(calledWithArguments[1]).to.deep.equal(['original','unvalidated','transactions']);
      // teardown
      Client.prototype.onReceivingSolution = realFunc;
    });
  });

  context('.onReceivingSolution validates solution, transactions, and updates blockchain', function(){
    it('.validateSolution verifies received proof-of-work', function(){
      var validSolution = 0.1;
      var invalidSolution = 0.9;
      var client1 = new Client('client1');
      expect(client1.validateSolution(validSolution)).to.be.true;
      expect(client1.validateSolution(invalidSolution)).to.be.false;
    });
    it('generates and records a reward for the solver', function(){
      // setup
      var realFunc = Client.prototype.generateRewardTransaction;
      var rewardTxn;
      Client.prototype.generateRewardTransaction = function(soln,id,amt){
        rewardTxn = realFunc(soln, id, amt);
        return rewardTxn;
      };
      // test
      var client1 = new Client('client1');
      client1.onReceivingSolution(0.1, [], client1.id); //todo allow mining on zero transactions?
      expect(rewardTxn.sender).to.equal('coinbase');
      expect(rewardTxn.outputs[0].amount).to.be.above(0);
      expect(rewardTxn.outputs[0].destination).to.equal(client1.id);
      // teardown
      Client.prototype.generateRewardTransaction = realFunc;
    });
    it('updates unusedValid & unvalidated transactions lists', function(){
      // setup
      var stubVerify = sinon.stub(Client.prototype, 'verify', function(){ return true; });
      var realFunc = Client.prototype.generateRewardTransaction;
      var rewardTxn;
      Client.prototype.generateRewardTransaction = function(soln,id,amt){
        rewardTxn = realFunc(soln, id, amt);
        return rewardTxn;
      };
      var client1 = new Client('client1');
      var initialTxn = new Transaction('coinbase');
      var unvalidatedTxn = new Transaction(client1);
      client1.unusedValidTransactions[initialTxn.id] = initialTxn;
      client1.unvalidatedTransactions = [unvalidatedTxn];
      // test
      expect(client1.unusedValidTransactions[initialTxn.id]).to.deep.equal(initialTxn);
      expect(client1.unvalidatedTransactions).to.deep.equal([unvalidatedTxn]);
      client1.onReceivingSolution(0.1, [unvalidatedTxn], client1.id);
      expect(client1.unusedValidTransactions[rewardTxn.id]).to.deep.equal(rewardTxn);
      expect(client1.unvalidatedTransactions).to.deep.equal([]);
      // teardown
      Client.prototype.generateRewardTransaction = realFunc;
      stubVerify.restore();
    });
    it('does not update transactions lists if solution is invalid', function(){
      var client1 = new Client('client1');
      var unvalidatedTxn = new Transaction(client1);
      client1.unvalidatedTransactions = [unvalidatedTxn];

      client1.onReceivingSolution('bad solution', [unvalidatedTxn], client1.id);
      expect(client1.unusedValidTransactions).to.deep.equal({});
      expect(client1.unvalidatedTransactions).to.deep.equal([unvalidatedTxn]);
    });
    it('does not update transactions lists if transactions are invalid', function(){
      var client1 = new Client('client1');
      var unvalidatedTxn = new Transaction(client1);
      unvalidatedTxn.addOutput('client1', 1);
      client1.unvalidatedTransactions = [unvalidatedTxn];

      client1.onReceivingSolution(0.1, [unvalidatedTxn], client1.id);
      expect(client1.unusedValidTransactions).to.deep.equal({});
      expect(client1.unvalidatedTransactions).to.deep.equal([unvalidatedTxn]);
    });
  });

  xcontext('Client scenarios', function(){
    it('can give an amount to another client', function(){expect(false).to.be.true;});
    it('cannot double-spend', function(){expect(false).to.be.true;});
    it('handles receiving concurrent solutions', function(){expect(false).to.be.true;});
    it('validates another proof-of-work solution', function(){expect(false).to.be.true;});
  });
});

xdescribe('Transaction', function(){
  it('uses previous transactions as inputs', function(){expect(false).to.be.true;});
  it('has a list of destination/amounts as outputs', function(){expect(false).to.be.true;});
  it('has a unique id', function(){expect(false).to.be.true;});
  it('knows who created the transaction', function(){expect(false).to.be.true;});
});
