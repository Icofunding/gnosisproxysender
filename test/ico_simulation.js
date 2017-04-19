const assert = require("assert")
const path = require("path")
const DutchAuction = artifacts.require("./DutchAuction.sol");
const ProxySender = artifacts.require("./ProxySender.sol")
const Token = artifacts.require("./Token.sol")
const { exec } = require('child_process')

const bidProxyPath = path.resolve(__dirname, '../bidProxy.js')

const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
  fn(...args, (err, res) => {
    if (err) reject(err)
    else resolve(res)
  })
})
const getBalance = promisify(web3.eth.getBalance)
const sendTransaction = promisify(web3.eth.sendTransaction)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Call json rpc method on current web3 provider
 * @param {string} method
 * @param {array=} args array of arguments of the rpc method
 * @returns {Promise}
 */
const rpc = (method, args) => new Promise((resolve, reject) => {
  const req = {
    jsonrpc: '2.0',
    method: method,
    id: new Date().getTime()
  }
  req.params = args

  web3.currentProvider.sendAsync(req, (err, result) => {
    if (err != null) return reject(err)
    else if (result.error != null) {
      reject(new Error('RPC Error: ' + (result.error.message || result.error)))
    } else {
      resolve(result)
    }
  })
})

contract('ICO', (accounts) => {
  let token, dutchAuction, proxySender
  it('deploy DutchAuction', async () => {
    dutchAuction = await DutchAuction.new(accounts[0], web3.toWei(20), 5114)
  })
  it('deploy token', async () => {
    token = await Token.new(web3.toWei(10000000), 'Gnosis', 18, 'GNO')
  })
  it('setup dutchAuction', async () => {
    await token.transfer(dutchAuction.address, web3.toWei(9000000))
    await dutchAuction.setup(token.address)
  })
  it('deploy ProxySender', async () => {
    proxySender = await ProxySender.new(dutchAuction.address)
    console.log('**** token', token.address)
    console.log('**** dutchAuction', dutchAuction.address)
    console.log('**** proxy', proxySender.address)
  })
  it('exec bidProxy', () => {
    exec(`${bidProxyPath} ${proxySender.address}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`bidProxy.js error: ${error}`);
        return;
      }
      console.log(`bidProxy.js output:\n${stdout}`);
      if (stderr) console.log(`stderr: ${stderr}`);
    });
  })
  it('fund proxy', async () => {
    await Promise.all([
      sendTransaction({ from: accounts[1], to: proxySender.address, value: web3.toWei(5) }),
      sendTransaction({ from: accounts[2], to: proxySender.address, value: web3.toWei(3) }),
      sendTransaction({ from: accounts[3], to: proxySender.address, value: web3.toWei(2) })
    ])
    const balance = await getBalance(proxySender.address)
    assert(balance.gt(0))
  })
  it('start ico', async function () {
    this.timeout(7000)
    await dutchAuction.startAuction()
    await delay(5500)
    // bidProxy process should have transfered ethers calling bidProxy()
    let balance = await getBalance(proxySender.address)
    assert(balance.eq(0))
  })
  it('direct bid and complete ico', async () => {
    await dutchAuction.bid(0, {from: web3.eth.accounts[4], value: web3.toWei(10)})
    const stage = await dutchAuction.stage()
    assert.equal(stage.toNumber(), 3)
  })
  it('go to final stage', async () => {
    // time warp 7 days
    await rpc('evm_increaseTime', [7 * 24 * 60 * 60 + 1])
    await dutchAuction.updateStage()
    const stage = await dutchAuction.stage()
    assert.equal(stage.toNumber(), 4)
  })
  it('claim tokens from account 4', async () => {
    let balance = await token.balanceOf(accounts[4])
    assert(balance.eq(0))

    await dutchAuction.claimTokens(0, { from: accounts[4] })

    balance = await token.balanceOf(accounts[4])
    assert(balance.gt(0))
  })
  it('claim tokens for proxy', async () => {
    let balance = await token.balanceOf(proxySender.address)
    assert(balance.eq(0))

    await proxySender.claimProxy()

    balance = await token.balanceOf(proxySender.address)
    assert(balance.gt(0))
  })
  it('claim tokens for proxy users', async () => {
    for (let i = 1; i <= 3; i++) {
      let balance = await token.balanceOf(accounts[i])
      assert(balance.eq(0))

      await sendTransaction({ from: accounts[i], to: proxySender.address })

      balance = await token.balanceOf(accounts[i])
      assert(balance.gt(0))
      console.log(`tokens balance #${i}`, web3.fromWei(balance).toString())
    }
  })

})