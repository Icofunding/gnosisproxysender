#!/usr/bin/env node

const process = require('process')
const Web3 = require('web3')

const proxy = process.argv.length > 2 ? process.argv[2] : '0x9eee5D62E311faA84dC9bfA3B6040E0D84D613f1'
const endpoint = process.argv.length > 3 ? process.argv[3] : 'http://localhost:8545'

console.log('Web3 provider: ' + endpoint)
console.log('ProxySender contract address:', proxy)

web3 = new Web3(new Web3.providers.HttpProvider(endpoint))

const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
  try {
    fn(...args, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  } catch (err) {
    reject(err)
  }
})
const getBalance = promisify(web3.eth.getBalance)
const sendTransaction = promisify(web3.eth.sendTransaction)
const call = promisify(web3.eth.call)
const getBlockNumber = promisify(web3.eth.getBlockNumber)
const sign = promisify(web3.eth.sign)

const timeout = (ms, timedPromise) => new Promise((resolve, reject) => {
  let timer = setTimeout(() => {
    timer = null
    reject()
  }, ms)
  timedPromise
    .then((res) => {
      if (timer) {
        clearTimeout(timer)
        resolve(res)
      }
    })
    .catch(err => {
      if (timer) clearTimeout(timer)
      reject(err)
    })
})

const LINELOGINTERVAL = 60000
let _lineLogTime = 0
const lineLog = (msg) => {
  msg = new Date().toLocaleString() + ' ' + msg
  if (Date.now() - _lineLogTime > LINELOGINTERVAL) {
    console.log(msg)
    _lineLogTime = Date.now()
  } else {
    process.stdout.write(msg + '\r')
  }
}

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
    try {
      balance = web3.fromWei(web3.toBigNumber(balance)).toDigits(5).toString() + ' eth'
    } catch (e) {
      balance = 'unknown'
    }
    lineLog(`Current block: ${blockNumber.toString()} - contract balance: ${balance}`)
    return call(bidProxy)
    .then(res => {
      // throws if not a number
      res = web3.toBigNumber(res)
      if (res.eq(0)) {
        return Promise.reject()
      } else {
        console.log(`Current block: ${blockNumber} - Contract balance: ${balance} - place bid`)
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
  2000
)

const checkGnosisToken = (proxy) => call({ to: proxy, data: '0x60fd902c' })
  .then(res => {
    res = web3.toBigNumber(res)
    if (res.eq(0)) return Promise.reject()
  })

// check if account is unlocked
console.log('Trying to use the account 0 to sign data 0x00 ...')
timeout(2000, sign(web3.eth.accounts[0], '0x00'))
  .catch(() => {
    console.error('Cannot sign data. Check if the node is reacheable and the account is unlocked.')
    process.exit(1)
  })
  .then(() => {
    console.log('Checking the ProxySender contract address...')
    return checkGnosisToken(proxy)
  })
  .catch((err) => {
    console.error('Gnosis token unknown. Check the ProxySender address.')
    process.exit(1)
  })
  .then(() => {
    lineLog('Starting...')
    // wait ICO start then call proxySend()
    loop()
  })

