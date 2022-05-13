import { inject, injectable } from "inversify";
import { MongoClient } from "mongodb";
import { IConfig } from "../Interfaces/IConfig";
import { ITxRepository } from "../Interfaces/Repository/ITxRepository";
import { IocKey } from "../Ioc/IocKey";
import { MongoBaseRepository, MongoProvider } from "./MongoBaseRepository";

@injectable()
export class TxRepository extends MongoBaseRepository implements ITxRepository {
  constructor(
    @inject(IocKey.DbClientProvider) db: MongoProvider,
    @inject(IocKey.Config) config: IConfig
  ) {
    super("tx", db, config);
  }

  async saveTx(tx: any): Promise<void> {
    await this.getCollection().then((col) => {
      col.insertOne(tx);
    });
  }
}
