const DuchAuction = artifacts.require("./DuchAuction.sol");
const ProxySender = artifacts.require("./ProxySender.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(DuchAuction, accounts[0], 284000000000000000000000, 5114)
    .then(() => DuchAuction.setup(/* token */))
    .then(() => deployer.deploy(ProxySender, DuchAuction.address))
};
