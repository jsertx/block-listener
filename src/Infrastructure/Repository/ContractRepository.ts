import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";

import { IConfig } from "../../Interfaces/IConfig";
import { IocKey } from "../../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";
import { PartialObjectDeep } from "type-fest/source/partial-deep";
import { Address, AddressRaw } from "../../Domain/Entities/Base/Address";
import { BlockchainId } from "../../Domain/Values/Blockchain";
import { Contract, ContractRaw } from "../../Domain/Entities/Contract";
import { IContractRepository } from "../../Domain/Repository/IContractRepository";

@injectable()
export class ContractRepository
  extends MongoBaseRepository<ContractRaw, Contract>
  implements IContractRepository
{
  constructor(
    @inject(IocKey.DbClient) client: MongoClient,
    @inject(IocKey.Config) config: IConfig
  ) {
    super("address", client, config);
  }

  protected getMatchCriteriaFromEntity(
    address: Address
  ): PartialObjectDeep<ContractRaw> {
    const { blockchain } = address.toRaw();
    return { blockchain, address: address.address };
  }

  protected modelToEntityMapper(model: WithId<ContractRaw>): Contract {
    return new Contract(model, model._id.toString());
  }

  findContract(
    address: string,
    blockchain: BlockchainId
  ): Promise<Contract | null> {
    return this.getCollection()
      .findOne({
        address,
        blockchain,
      })
      .then((res) => {
        if (!res) {
          return null;
        }
        return this.modelToEntityMapper(res);
      });
  }
}
