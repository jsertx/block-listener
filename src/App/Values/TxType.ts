export enum TxType {
	Unknown = "unknown",
	// TokenTransfer = "token_transfer",
	DexSwap = "dex_swap",
	DexSwapUniswapV3 = "dex_swap.uniswap.v3",
	EthTransfer = "eth_transfer"
}

export const txTypeList = Object.values(TxType);
