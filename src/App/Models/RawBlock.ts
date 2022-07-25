import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { Blockchain } from "../Values/Blockchain";

export interface RawBlock {
  blockchain: Blockchain;
  block: BlockWithTransactions;
}
