# ProxySender contract for Gnosis ICO
Tools for Gnosis ICO:

- **constracts/proxysender.sol**: smart contract to collect ethers from different users and proxy ico bids
- **bidProxy.js**: small tool that wait for ico start and immediatelly call bidProxy() on the ProxySender contract

## Requirement

- [Node.js](http://nodejs.org) version 7.9.0 or later
- [Truffle](http://truffleframework.com/) version 3.2.1 or later (for testing)
- [TestRPC](https://github.com/ethereumjs/testrpc) (for testing)

## Run the bidProxy tool

The tool requires an ethereum node on main network, rpc enabled, **accound 0 unlocked** with some ethers to pay transaction fees.
Run:

    ./bidProxy.js <gnosis_dutch_auction_address>
    
where _<gnosis_dutch_auction_address>_ is the address of the official smart contract for gnosis ico.

**Reminder**: to start a node (geth or parity) with an unlocked account use the `--unlock <address> --password <file>` parameters.

## ICO simulation
The simulation works only with TestRPC node because it requires the `evm_increaseTime` rpc method
to skip the 1 week waiting period at the end of the auction.

Run ethereum node:

    testrpc

Run ICO simulation:

    truffle test test/ico_simulation.js

## ProxySender smart contract

- Before ICO start, users send own ethers to the ProxySender smartcontract using a normal transaction.
- Before ICO start, users can ask a refund using the `refund()` method.
- After ICO start, `bidProxy()` must be called to send funds to the ICO contract (the bidProxy tool can be used).
- After ICO end, `claimProxy()` must be called to reclaim tokens for the proxy.
- After the tokens are reclaimed for the proxy, users reclaim own tokens sending a normal transaction with value 0 to
the proxy address

Use the following method ids in the data field of transaction to call the contract methods:

```
ed9a3ac1 bidProxy()
30b66cee claimProxy()
590e1ae3 refund()
```
