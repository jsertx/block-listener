import { Blockchain } from "../Values/Blockchain";

export interface RawTxId {
  blockchain: Blockchain;
  hash: string;
}
