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

export type RoutingKeyCreator = (blockchain: string, prefix?: string) => string;

const routingKeyCreatorFactory =
	(binding: string): RoutingKeyCreator =>
	(blockchain: string, _prefix?: string) => {
		const prefix = _prefix ? `${_prefix}.` : "";
		return `${prefix}${blockchain}.${binding}`;
	};

export const RoutingKey = {
	BlockReceived: routingKeyCreatorFactory("block.evt.received"),
	WalletDiscovered: routingKeyCreatorFactory("wallet.evt.wallet_discovered"),
	TokenDiscovered: routingKeyCreatorFactory("token.evt.discovered"),
	TxDiscovered: routingKeyCreatorFactory("tx.evt.discovered"),
	WalletSaved: routingKeyCreatorFactory("wallet.evt.wallet_saved"),
	WalletUpdated: routingKeyCreatorFactory("wallet.evt.wallet_updated")
};
