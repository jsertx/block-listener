import { ethers } from "ethers";
import { Blockchain } from "../../Domain/Values/Blockchain";

export interface UnprocessedTx {
  blockchain: Blockchain;
  raw: ethers.providers.TransactionResponse;
}
