import { Wallet } from "../Entities/Wallet";
import { BlockchainId } from "../Values/Blockchain";
import { IBaseRepository } from "./IBaseRepository";

export interface IWalletRepository extends IBaseRepository<Wallet> {
  findWallet(address: string, blockchain: BlockchainId): Promise<Wallet | null>;
}
