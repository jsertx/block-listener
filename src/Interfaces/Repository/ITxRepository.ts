import { ethers } from "ethers";

export interface ITxRepository {
  saveTx(tx: any): Promise<void>;
  findAll(): Promise<ethers.providers.TransactionReceipt[]>;
}
