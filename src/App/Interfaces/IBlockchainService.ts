import { BlockchainId } from "../Values/Blockchain";

export interface IBlockchainService {
  getTransactionsForAddress(
    blockchain: BlockchainId,
    address: string
  ): Promise<string[]>;
}
