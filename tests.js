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
