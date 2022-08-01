import { ethers } from "ethers";

export const isNativeTokenTx = (tx: ethers.providers.TransactionResponse) =>
	!tx.data || tx.data === "0x";

export const isSmartContractCall = (res: ethers.Transaction) =>
	res.data !== "0x";
