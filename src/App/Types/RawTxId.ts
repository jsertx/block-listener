import { BlockchainId } from "../Values/Blockchain";

export interface RawTxId {
  blockchain: BlockchainId;
  hash: string;
}
