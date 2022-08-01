import { ethers } from "ethers";

export type BlockWithTransactions = Omit<
	ethers.providers.Block,
	"transactions"
> & {
	transactions: Array<ethers.providers.TransactionResponse>;
};
