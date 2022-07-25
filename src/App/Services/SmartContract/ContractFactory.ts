import { ethers } from "ethers";
import { inject, injectable } from "inversify";

import { IContractFactory } from "../../Interfaces/IContractFactory";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { IocKey } from "../../../Ioc/IocKey";
import { Contract } from "../../Entities/Contract";

@injectable()
export class ContractFactory implements IContractFactory {
  constructor(
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory
  ) {}

  getContract(contract: Contract, _provider?: ethers.providers.BaseProvider) {
    const provider =
      _provider || this.providerFactory.getProvider(contract.blockchain);

    if (!contract.abi) {
      throw new Error(
        `Address ${contract.address}@${contract.blockchain} has no abi`
      );
    }
    return new ethers.Contract(contract.address, contract.abi, provider);
  }
}
