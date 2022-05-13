import { inject, injectable } from "inversify";
import { MongoClient } from "mongodb";
import { Address, AddressType, ContractType } from "../Domain/Entities/Address";
import { IConfig } from "../Interfaces/IConfig";
import { IAddressRepository } from "../Interfaces/Repository/IAddressRepository";
import { IocKey } from "../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";

@injectable()
export class AddressRepository
  extends MongoBaseRepository<Address>
  implements IAddressRepository
{
  constructor(
    @inject(IocKey.DbClient) client: MongoClient,
    @inject(IocKey.Config) config: IConfig
  ) {
    super("address", client, config);
  }

  getSmartContracts() {
    return this.getCollection().find({
      type: AddressType.Contract,
    });
  }
}
