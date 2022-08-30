import { BlockchainId } from "../Values/Blockchain";

export interface IBlockchainService {
	getWalletTxsHashes(
		blockchain: BlockchainId,
		address: string
	): Promise<string[]>;
}
