import { BlockchainId } from "../Values/Blockchain";

export interface RawTxId {
  blockchain: BlockchainId;
  blockNumber: number;
  hash: string;
}
