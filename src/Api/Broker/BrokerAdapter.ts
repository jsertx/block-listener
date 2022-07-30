import { inject, injectable } from "inversify";
import { Contract, ContractRaw } from "../../App/Entities/Contract";
import { Wallet, WalletRaw } from "../../App/Entities/Wallet";
import { IAddressService } from "../../App/Interfaces/IAddressService";
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

  start() {}
}
