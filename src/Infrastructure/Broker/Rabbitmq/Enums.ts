export enum Exchange {
	Block = "block",
	Wallet = "wallet",
	Contract = "contract",
	Token = "token",
	Tx = "tx"
}

export enum Queue {
	FindDirectTx = "find_direct_tx",
	FindInternalTx = "find_internal_tx",
	SaveWallet = "save_wallet",
	SaveTx = "save_tx",
	SaveToken = "save_token"
}

export enum RoutingKey {
	BlockReceived = "block.evt.received",
	WalletDiscovered = "wallet.evt.wallet_discovered",
	TokenDiscovered = "token.evt.discovered",
	TxDiscovered = "tx.evt.discovered",
	TxSaved = "tx.evt.saved",
	WalletSaved = "wallet.evt.wallet_saved",
	WalletUpdated = "wallet.evt.wallet_updated"
}

export enum Publication {
	BlockReceived = "block_received",
	TxDiscovered = "tx_dicovered",
	TxSaved = "tx_saved",
	WalletDiscovered = "wallet_discovered",
	WalletSaved = "wallet_saved",
	WalletUpdated = "wallet_updated",
	TokenDiscovered = "token_discovered"
}
