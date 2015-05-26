describe('Wallet', function(){
  it('is created by another wallet', function(){
    genesisWallet = new Wallet('genesis block');
    var wallet = genesisWallet.spawnNewWallet('anne'); // todo how to get initial blockchain? spawn from genesis wallet || central blockchain
    expect(wallet.publicKey).to.equal('anne');
    expect(wallet.balance).to.equal(0);
  });
  it('has a balance and public key/address', function(){
    var wallet = new Wallet('anne'); // todo how to get initial blockchain? spawn from genesis wallet || central blockchain
    expect(wallet.publicKey).to.equal('anne');
    expect(wallet.balance).to.equal(0);
  });
  it('creates transactions', function(){
    var wallet = new Wallet();
    var txn = wallet.give('anne', 1);
    // verify transaction
  });
  it('broadcasts transactions it creates for transaction', function(){
    // stub Socket.broadcast('transaction') and check for its call
    var wallet = new Wallet();
    var txn = wallet.give('anne', 1);
  });
});

describe('Transaction', function(){
  it('has a reference transaction', function(){
    var txn = new Transaction('txn-for-8-coins', 'anne', 1);
    expect(txn.reference).to.equal('txn-for-8-coins');
  });
  it('has a destination', function(){
    var txn = new Transaction('txn-for-8-coins', 'anne', 1);
    expect(txn.destination).to.equal('anne');
  });
  it('has an amount', function(){
    var txn = new Transaction('txn-for-8-coins', 'anne', 1);
    expect(txn.amount).to.equal(1);
  });
});

describe('Miner', function(){
  it('validates that transaction accounts for all coins from previous validated transactions', function(){
    txn = new Transaction();
    txn.ins = []
    txn.outs.push({recipient:bob, amount:10})
  });
  it('does not validate a transaction that overspends', function(){
    txn = new Transaction();
    txn.ins.push('txn for 8 coins');
    txn.outs.push({recipient:'bob', amount:10});
  });
  it('broadcasts a solution to the proof-of-work problem', function(){

  });
  it('receives coins for being the first to verify a transaction', function(){
    Blockchain.give()
  });
});
