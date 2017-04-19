from ..abstract_test import AbstractTestContract, accounts, keys, TransactionFailed


class TestContract(AbstractTestContract):
    """
    run test with python -m unittest contracts.tests.do.test_proxy_sender
    """

    BACKER_1 = 1
    BACKER_2 = 2
    BLOCKS_PER_DAY = 5760
    TOTAL_TOKENS = 10000000 * 10**18
    MAX_TOKENS_SOLD = 9000000
    PREASSIGNED_TOKENS = 1000000 * 10**18
    WAITING_PERIOD = 60*60*24*7
    FUNDING_GOAL = 250000 * 10**18
    START_PRICE_FACTOR = 4000
    MAX_GAS = 150000  # Kraken gas limit

    def __init__(self, *args, **kwargs):
        super(TestContract, self).__init__(*args, **kwargs)

    def test(self):
        # Create wallet
        required_accounts = 1
        wa_1 = 1
        constructor_parameters = (
            [accounts[wa_1]],
            required_accounts
        )
        self.multisig_wallet = self.s.abi_contract(
            self.pp.process(self.WALLETS_DIR + 'MultiSigWalletWithDailyLimit.sol', add_dev_code=True,
                            contract_dir=self.contract_dir),
            language='solidity',
            constructor_parameters=constructor_parameters
        )
        # Create dutch auction
        self.dutch_auction = self.s.abi_contract(self.pp.process(self.dutch_auction_name,
                                                                 add_dev_code=True,
                                                                 contract_dir=self.contract_dir),
                                                 constructor_parameters=(self.multisig_wallet.address,
                                                                         250000 * 10 ** 18,
                                                                         4000),
                                                 language='solidity')
        # Create Gnosis token
        self.gnosis_token = self.s.abi_contract(self.pp.process(self.gnosis_token_name,
                                                                add_dev_code=True,
                                                                contract_dir=self.contract_dir),
                                                language='solidity',
                                                constructor_parameters=(self.dutch_auction.address,
                                                                        [self.multisig_wallet.address],
                                                                        [self.PREASSIGNED_TOKENS]))

        # Setup dutch auction
        self.dutch_auction.setup(self.gnosis_token.address)
        # Create proxy sender
        self.proxy_sender = self.s.abi_contract(
            self.pp.process(self.DO_DIR + 'ProxySender.sol', add_dev_code=True,
                            contract_dir=self.contract_dir),
            language='solidity'
        )
        # Setup proxy sender
        self.proxy_sender.changeSettings(self.dutch_auction.address, self.gnosis_token.address)
        # Settings can be overwritten
        self.proxy_sender.changeSettings(self.dutch_auction.address, self.dutch_auction.address)
        self.proxy_sender.changeSettings(self.dutch_auction.address, self.gnosis_token.address)
        # Collect bids
        bidder_1 = 1
        value_1 = 100000 * 10 ** 18  # 100k Ether
        self.s.send(keys[bidder_1], self.proxy_sender.address, value_1)
        bidder_2 = 2
        value_2 = 120000 * 10 ** 18  # 120k Ether
        self.s.send(keys[bidder_2], self.proxy_sender.address, value_2)
        bidder_3 = 3
        value_3 = 100000 * 10 ** 18  # 100k Ether
        self.proxy_sender.contribute(sender=keys[bidder_3], value=value_3)
        # Bid proxy will fail before auction starts
        self.assertRaises(TransactionFailed, self.proxy_sender.bidProxy)
        # Start auction
        start_auction_data = self.dutch_auction.translator.encode('startAuction', [])
        self.multisig_wallet.submitTransaction(self.dutch_auction.address, 0, start_auction_data, sender=keys[wa_1])
        # Bid proxy works now
        self.assertEqual(self.s.block.get_balance(self.proxy_sender.address), value_1 + value_2 + value_3)
        self.proxy_sender.bidProxy()
        self.assertEqual(self.s.block.get_balance(self.proxy_sender.address),
                         value_1 + value_2 + value_3 - 250000 * 10**18)
        # After proxy bid was sent, no new contributions can be made
        self.assertRaises(TransactionFailed, self.s.send, keys[bidder_1], self.proxy_sender.address, value_1)
        # Bid proxy works only once
        self.assertRaises(TransactionFailed, self.proxy_sender.bidProxy)
        # Auction is over, no more bids are accepted
        # There is no money left in the contract
        self.assertEqual(self.s.block.get_balance(self.dutch_auction.address), 0)
        # Auction ended but trading is not possible yet, because there is one week pause after auction ends
        self.assertRaises(TransactionFailed, self.proxy_sender.claimProxy)
        # We wait for one week
        self.s.block.timestamp += self.WAITING_PERIOD
        self.assertRaises(TransactionFailed,
                          self.dutch_auction.claimTokens,
                          sender=keys[bidder_1])
        # Go past one week
        self.s.block.timestamp += 1
        self.dutch_auction.updateStage()
        # Claiming is possible now
        self.proxy_sender.claimProxy()
        # But only once
        self.assertRaises(TransactionFailed, self.proxy_sender.claimProxy)
        # Transfer claimed tokens
        total_tokens = self.gnosis_token.balanceOf(self.proxy_sender.address)
        total_refund = self.s.block.get_balance(self.gnosis_token.address)
        self.proxy_sender.transfer(sender=keys[bidder_1])
        self.assertEqual(self.gnosis_token.balanceOf(self.proxy_sender.address),
                         total_tokens - (total_tokens * 10 / 32))
        self.assertEqual(self.s.block.get_balance(self.gnosis_token.address),
                         total_refund - (total_refund * 10 / 32))
        self.s.send(keys[bidder_2], self.proxy_sender.address, 0)
        self.assertEqual(self.gnosis_token.balanceOf(self.proxy_sender.address),
                         total_tokens - (total_tokens * 10 / 32) - (total_tokens * 12 / 32))
        self.assertEqual(self.s.block.get_balance(self.gnosis_token.address),
                         total_refund - (total_refund * 10 / 32) - (total_refund * 12 / 32))
        # Confirm token balances
        self.assertEqual(self.gnosis_token.balanceOf(accounts[bidder_1]), (total_tokens * 10 / 32))
        self.assertEqual(self.gnosis_token.balanceOf(accounts[bidder_2]), (total_tokens * 12 / 32))