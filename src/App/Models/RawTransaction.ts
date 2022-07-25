import { ethers } from "ethers";
import { Blockchain } from "../Values/Blockchain";

export interface RawTransaction {
  blockchain: Blockchain;
  raw: ethers.providers.TransactionResponse;
}
