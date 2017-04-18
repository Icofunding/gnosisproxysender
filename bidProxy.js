#!/usr/bin/env node

const process = require('process')
const Web3 = require('web3')

const proxy = process.argv.length > 2 ? process.argv[2] : '0x9eee5D62E311faA84dC9bfA3B6040E0D84D613f1'
const endpoint = process.argv.length > 3 ? process.argv[3] : 'http://localhost:8545'

console.log('Web3 provider: ' + endpoint)
console.log('ProxySender contract address:', proxy)

web3 = new Web3(new Web3.providers.HttpProvider(endpoint))

const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
  fn(...args, (err, res) => {
    if (err) reject(err)
    else resolve(res)
  })
})
const getBalance = promisify(web3.eth.getBalance)
const sendTransaction = promisify(web3.eth.sendTransaction)
const call = promisify(web3.eth.call)
const getBlockNumber = promisify(web3.eth.getBlockNumber)


// bidProxy
function tryBid () {
  return Promise.all([
    getBalance(proxy),
    getBlockNumber()
  ])
  .then(([balance, blockNumber]) => {
    const bidProxy = {
      from: web3.eth.accounts[ 0 ],
      to: proxy,
      data: '0xed9a3ac1',
      gas: 1000000
    }
    process.stdout.write('Current block: ' + blockNumber.toString() + '\r')
    return call(bidProxy)
    .then(res => {
      // throws if not a number
        res = web3.toBigNumber(res)
      if (res.eq(0)) {
        return Promise.reject()
      } else {
        console.log('Current block:', blockNumber, '- place bid')
        return sendTransaction(bidProxy)
        .then(txid => console.log('transaction:', txid))
      }
    })
  })
}


const loop = () => setTimeout(
  () => {
    tryBid()
      .catch(() => loop())
  },
  5000
)

loop()
