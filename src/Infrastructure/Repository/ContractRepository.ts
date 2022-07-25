import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";

import { IConfig } from "../../Interfaces/IConfig";
import { IocKey } from "../../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";
import { PartialObjectDeep } from "type-fest/source/partial-deep";

import { BlockchainId } from "../../App/Values/Blockchain";
import { Contract, ContractRaw } from "../../App/Entities/Contract";
import { IContractRepository } from "../../App/Repository/IContractRepository";

@injectable()
export class ContractRepository
  extends MongoBaseRepository<ContractRaw, Contract>
  implements IContractRepository
{
  constructor(
    @inject(IocKey.DbClient) client: MongoClient,
    @inject(IocKey.Config) config: IConfig
  ) {
    super("contracts", client, config);
  }

  protected getMatchCriteriaFromEntity(
    contract: Contract
  ): PartialObjectDeep<ContractRaw> {
    const { blockchain, address } = contract.toRaw();
    return { blockchain, address };
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
