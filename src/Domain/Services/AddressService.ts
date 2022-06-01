import { inject, injectable } from "inversify";
import { IContractRepository } from "../Repository/IContractRepository";
import { IocKey } from "../../Ioc/IocKey";
import { IAddressService } from "../Interfaces/IAddressService";
import { Contract } from "../Entities/Contract";
import { Wallet } from "../Entities/Wallet";
import { IWalletRepository } from "../Repository/IWalletRepository";

@injectable()
export class AddressService implements IAddressService {
  constructor(
    @inject(IocKey.ContractRepository)
    private contractRepository: IContractRepository,
    @inject(IocKey.WalletRepository) private walletRepository: IWalletRepository
  ) {}

  findAllWallets(): Promise<Wallet[]> {
    return this.walletRepository.findAll();
  }
  findAllContracts(): Promise<Contract[]> {
    return this.contractRepository.findAll();
  }

  saveWallet(wallet: Wallet): Promise<Wallet> {
    return this.walletRepository.saveIfNotExist(wallet);
  }

  saveContract(contract: Contract): Promise<Contract> {
    return this.contractRepository.saveIfNotExist(contract);
  }
}
