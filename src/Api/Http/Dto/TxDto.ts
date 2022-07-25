import { BlockchainId } from "../../../App/Values/Blockchain";

export interface TxSimplifiedDto {
  hash: string;
  blockchain: BlockchainId;
  block: number;
  timestamp: number;
  data: any;
}
