import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { inject, injectable } from "inversify";
import { MongoClient } from "mongodb";
import { IConfig } from "../Interfaces/IConfig";
import { ITxRepository } from "../Interfaces/Repository/ITxRepository";
import { IocKey } from "../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";

@injectable()
export class TxRepository extends MongoBaseRepository implements ITxRepository {
  constructor(
    @inject(IocKey.DbClient) client: MongoClient,
    @inject(IocKey.Config) config: IConfig
  ) {
    super("tx", client, config);
  }

  async findAll(): Promise<TransactionReceipt[]> {
    return this.getCollection().find().toArray() as any;
  }

  async saveTx(tx: any): Promise<void> {
    await this.getCollection().insertOne(tx);
  }
}
