#!/usr/bin/env node

const process = require('process')
const Web3 = require('web3')

const proxy = process.argv.length > 2 ? process.argv[2] : '0x9eee5D62E311faA84dC9bfA3B6040E0D84D613f1'
const endpoint = process.argv.length > 3 ? process.argv[3] : 'http://localhost:8545'

console.log('Web3 provider: ' + endpoint)
console.log('ProxySender contract address:', proxy)

web3 = new Web3(new Web3.providers.HttpProvider(endpoint))

const ProxySenderABI = '[{"constant":true,"inputs":[],"name":"AUCTION_STARTED","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"claimProxy","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalContributions","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"contributions","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"refund","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"gnosisToken","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalTokens","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"transfer","outputs":[{"name":"amount","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"TRADING_STARTED","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"dutchAuction","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"stage","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"contribute","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[],"name":"bidProxy","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"inputs":[{"name":"_dutchAuction","type":"address"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"BidSubmission","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"RefundSubmission","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"RefundReceived","type":"event"}]'
// const DutchAuctionABI = '[{"constant":true,"inputs":[],"name":"MAX_TOKENS_SOLD","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"endTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_ceiling","type":"uint256"},{"name":"_priceFactor","type":"uint256"}],"name":"changeSettings","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"calcTokenPrice","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"startBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"wallet","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"gnosisToken","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"bids","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_gnosisToken","type":"address"}],"name":"setup","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"startAuction","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"WAITING_PERIOD","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"ceiling","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"receiver","type":"address"}],"name":"bid","outputs":[{"name":"amount","type":"uint256"}],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"totalReceived","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"finalPrice","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"stage","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"updateStage","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"calcCurrentTokenPrice","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"calcStopPrice","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"receiver","type":"address"}],"name":"claimTokens","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"priceFactor","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"_wallet","type":"address"},{"name":"_ceiling","type":"uint256"},{"name":"_priceFactor","type":"uint256"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"BidSubmission","type":"event"}]'
const proxySender = web3.eth.contract(JSON.parse(ProxySenderABI)).at(proxy)
let dutchAuctionAddress

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
const getTransaction = promisify(web3.eth.getTransaction)

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
      console.log(`Current block: ${blockNumber} - Contract balance: ${balance} - place bid`)
      return sendTransaction(bidProxy)
        .then(txid => console.log('transaction:', txid))
    })
}

const loop = () => {
  web3.eth.filter(
    'pending',
    (err, res) => {
      if (err) {
        console.error(err)
        process.exit(1)
      } else {
        getTransaction(res)
          .then(tx => {
            if (tx.input === '0x6b64c769' && tx.to === dutchAuctionAddress) {
              tryBid()
                .catch(err => console.log('failed'))
                .then(() => process.exit(0))
            }
          })
      }
    }
  )
}

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
  //   Promise.resolve()
  .then(() => {
    console.log('Checking the ProxySender contract address...')
    return checkGnosisToken(proxy)
  })
  .catch((err) => {
    console.error('Gnosis token unknown. Check the ProxySender address.')
    process.exit(1)
  })
  .then(() => promisify(proxySender.dutchAuction)())
  .then((address) => { dutchAuctionAddress = address })
  .then(() => {
    lineLog('Starting...')
    // wait ICO start then call proxySend()
    loop()
  })

