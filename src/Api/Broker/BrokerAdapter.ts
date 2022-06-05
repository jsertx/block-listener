import { inject, injectable } from "inversify";
import { Contract, ContractRaw } from "../../Domain/Entities/Contract";
import { Wallet, WalletRaw } from "../../Domain/Entities/Wallet";
import { IAddressService } from "../../Domain/Interfaces/IAddressService";
import { IAdapter } from "../../Interfaces/IAdapter";
import { IBroker } from "../../Interfaces/IBroker";
import { IocKey } from "../../Ioc/IocKey";
import { createSubHandler } from "./Utils";

@injectable()
export class BrokerAdapter implements IAdapter {
  constructor(
    @inject(IocKey.Broker) private broker: IBroker,
    @inject(IocKey.AddressService) private addressService: IAddressService
  ) {}

  start() {
    this.broker.subscribe(
      "create_wallet",
      createSubHandler((wallet: WalletRaw) =>
        this.addressService.saveWallet(Wallet.create(wallet))
      )
    );

    this.broker.subscribe(
      "create_contract",
      createSubHandler((contract: ContractRaw) =>
        this.addressService.saveContract(Contract.create(contract))
      )
    );
  }
}
