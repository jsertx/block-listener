import { Block, BlockIdProps } from "../Entities/Block";
import { BlockchainId } from "../Values/Blockchain";
import { IBaseRepository } from "./IBaseRepository";

export interface IBlockRepository extends IBaseRepository<Block, BlockIdProps> {
	findLatestBlock(blockchain: BlockchainId): Promise<Block | undefined>;
}
