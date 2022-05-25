import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";

import { AddressType } from "../../Domain/Values/AddressType";
import { IConfig } from "../../App/Interfaces/IConfig";
import { IAddressRepository } from "../../Domain/Repository/IAddressRepository";
import { IocKey } from "../../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";
import { PartialObjectDeep } from "type-fest/source/partial-deep";
import { Address, AddressRaw } from "../../Domain/Entities/Address";

@injectable()
export class AddressRepository
  extends MongoBaseRepository<AddressRaw, Address>
  implements IAddressRepository
{
  constructor(
    @inject(IocKey.DbClient) client: MongoClient,
    @inject(IocKey.Config) config: IConfig
  ) {
    super("address", client, config);
  }

  protected getMatchCriteriaFromEntity(
    address: Address
  ): PartialObjectDeep<AddressRaw<any>> {
    const { blockchain } = address.toRaw();
    return { blockchain, address: address.address };
  }

  protected modelToEntityMapper(model: WithId<AddressRaw<any>>): Address {
    return new Address(model, model._id.toString());
  }

  getSmartContracts(): Promise<Address[]> {
    return this.getCollection()
      .find({
        type: AddressType.Contract,
      })
      .map(this.modelToEntityMapper)
      .toArray();
  }
}
