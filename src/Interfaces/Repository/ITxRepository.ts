import { ethers } from "ethers";
import { IBaseRepository } from "./IBaseRepository";

export interface ITxRepository
  extends IBaseRepository<ethers.providers.TransactionReceipt> {}
