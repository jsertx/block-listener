import { Tx, TxIdProps } from "../Entities/Tx";
import { BlockchainId } from "../Values/Blockchain";
import { IBaseRepository } from "./IBaseRepository";

export interface ITxRepository extends IBaseRepository<Tx<any>, TxIdProps> {
	getAllTokensFoundInSwaps(blockchain: BlockchainId): Promise<{
		blockchain: BlockchainId;
		addresses: string[];
	}>;
}
