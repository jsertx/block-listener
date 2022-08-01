export enum TxType {
  Unknown = "unknown",
  // TokenTransfer = "token_transfer",
  DexSwap = "dex_swap",
  EthTransfer = "eth_transfer",
}

export const txTypeList = Object.values(TxType);
