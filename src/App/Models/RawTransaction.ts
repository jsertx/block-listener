import { ethers } from "ethers";
import { BlockchainId } from "../Values/Blockchain";

export interface RawTransaction {
  blockchain: BlockchainId;
  raw: ethers.providers.TransactionResponse;
}
