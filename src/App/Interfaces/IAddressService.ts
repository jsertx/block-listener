import { Contract } from "../Entities/Contract";
import { Wallet } from "../Entities/Wallet";

export interface IAddressService {
  saveWallet(wallet: Wallet): Promise<Wallet>;
  saveContract(contract: Contract): Promise<Contract>;

  findAllWallets(): Promise<Wallet[]>;
  findAllContracts(): Promise<Contract[]>;
}
