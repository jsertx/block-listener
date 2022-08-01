import { Wallet, WalletIdProps } from "../Entities/Wallet";
import { BlockchainId } from "../Values/Blockchain";
import { IBaseRepository } from "./IBaseRepository";

export interface IWalletRepository
	extends IBaseRepository<Wallet, WalletIdProps> {
	findWallet(
		address: string,
		blockchain: BlockchainId
	): Promise<Wallet | null>;
}
