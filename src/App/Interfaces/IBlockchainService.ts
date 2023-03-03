import { BlockchainId } from "../Values/Blockchain";

export interface TxMetadata {
	hash: string;
	blockHeight: string;
}
export interface IBlockchainService {
	getWalletTxsWithMetadata(
		blockchain: BlockchainId,
		address: string
	): Promise<TxMetadata[]>;
}
