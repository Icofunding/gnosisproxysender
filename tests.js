const proxy = '0x9eee5D62E311faA84dC9bfA3B6040E0D84D613f1'
for (let i=0; i < 4; i++ ) {
  web3.eth.sendTransaction({ from: web3.eth.accounts[ i ], to: proxy, value: web3.toWei(i + 1) }, (err, txid) => console.log(txid))
}


// refund
web3.eth.sendTransaction({ from: web3.eth.accounts[ 1 ], to: proxy, value: web3.toWei(3) }, (err, txid) => console.log(txid))
for (let i=0; i < 4; i++ ) {
  web3.eth.sendTransaction({
    from: web3.eth.accounts[ i ],
    to: proxy,
    data: '0x590e1ae3'
  }, (err, txid) => console.log(txid))
}


const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
  fn(...args, (err, res) => {
    if (err) reject(err)
    else resolve(res)
  })
})
const getBalance = promisify(web3.eth.getBalance)
const sendTransaction = promisify(web3.eth.sendTransaction)
// bidProxy


getBalance(proxy)
.then(balance => {
  return sendTransaction({
    from: web3.eth.accounts[ 0 ],
    to: proxy,
    data: '0xed9a3ac1'
  })
  .then(() => getBalance(proxy))
  .then(newBalance => {
    if (newBalance.eq(balance)) console.log('invariato')
    else console.log('variato - balance:', web3.fromWei(newBalance).toFixed())
  })
})

//
// **** token 0xb791b8e3c92718f4cafdb2d98efcc0d739fab471
// **** dutchAuction 0xd0a37bc697eb5bea3699a301a3f220fabce4f240
// **** proxy 0x32e8ebe08ff4c823c1908d72ae1b30fda6069cda
//
// web3.eth.sendTransaction({from: web3.eth.accounts[0], to: '0x32e8ebe08ff4c823c1908d72ae1b30fda6069cda', value: web3.toWei(1)})
// web3.eth.getBalance('0x32e8ebe08ff4c823c1908d72ae1b30fda6069cda')
// DutchAuction.at('0xd0a37bc697eb5bea3699a301a3f220fabce4f240').startAuction()
