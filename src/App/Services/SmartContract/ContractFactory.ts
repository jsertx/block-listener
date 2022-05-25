import { Contract, ethers } from "ethers";
import { inject, injectable } from "inversify";

import { IContractFactory } from "../../Interfaces/IContractFactory";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { IocKey } from "../../../Ioc/IocKey";
import { ABI } from "./ABI";
import { ContractAddress } from "../../../Domain/Entities/ContractAddress";
import { AddressType } from "../../../Domain/Values/AddressType";
import { ContractType } from "../../../Domain/Values/ContractType";

@injectable()
export class ContractFactory implements IContractFactory {
  constructor(
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory
  ) {}
  getContract(
    address: ContractAddress,
    _provider?: ethers.providers.BaseProvider
  ) {
    if (address.type !== AddressType.Contract) {
      throw new Error(
        `Address ${address.address}@${address.blockchain} is not a contract`
      );
    }

    const provider =
      _provider || this.providerFactory.getProvider(address.blockchain);

    if (!address.abi) {
      throw new Error(
        `Address ${address.address}@${address.blockchain} has no abi`
      );
    }
    return new ethers.Contract(address.address, address.abi, provider);
  }
}
