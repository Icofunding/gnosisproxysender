const DutchAuction = artifacts.require("./DutchAuction.sol");
const ProxySender = artifacts.require("./ProxySender.sol")
const Token = artifacts.require("./Token.sol")


const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
  fn(...args, (err, res) => {
    if (err) reject(err)
    else resolve(res)
  })
})
const getBalance = promisify(web3.eth.getBalance)
const sendTransaction = promisify(web3.eth.sendTransaction)

contract('ICO test', function(accounts) {
  let proxySender
  before(() => {
    return Promise.all([
      DutchAuction.new(accounts[0], web3.toWei(2), 5114),
      Token.new(web3.toWei(10000000), 'Gnosis', 18, 'GNO')
    ])
    .then(([ dutchAuction, token ]) => {
      console.log('**** token', token.address)
      console.log('**** dutchAuction', dutchAuction.address)
      return token.transfer(dutchAuction.address, web3.toWei(9000000))
      .then(() => dutchAuction.setup(token.address))
      .then(() => ProxySender.new(dutchAuction.address))
      .then(contract => { proxySender = contract })
    })
  })
  it("prova", () => {
    console.log('**** proxy', proxySender.address)
  })
})