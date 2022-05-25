import { ethers } from "ethers";

export const isNativeTokenTx = (tx: ethers.providers.TransactionResponse) =>
  !tx.data || tx.data === "0x";
