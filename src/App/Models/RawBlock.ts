import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { BlockchainId } from "../Values/Blockchain";

export interface RawBlock {
  blockchain: BlockchainId;
  block: BlockWithTransactions;
}
