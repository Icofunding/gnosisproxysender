const DutchAuction = artifacts.require("./DutchAuction.sol");
const ProxySender = artifacts.require("./ProxySender.sol");
const Token = artifacts.require("./Token.sol");

module.exports = function(deployer, network, accounts) {
  // deployer.deploy(DuchAuction, accounts[0], 284000000000000000000000, 5114)
  //   .then(() => DuchAuction.setup(/* token */))
  //   .then(() => deployer.deploy(ProxySender, DuchAuction.address))
};
