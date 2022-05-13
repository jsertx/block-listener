import { injectable, unmanaged } from "inversify";
import { MongoClient } from "mongodb";
import { IConfig } from "../Interfaces/IConfig";

export type MongoProvider = () => Promise<MongoClient>;

@injectable()
export abstract class MongoBaseRepository {
  constructor(
    @unmanaged() protected collection: string,
    @unmanaged() protected db: MongoProvider,
    @unmanaged() protected config: IConfig
  ) {}

  protected getCollection() {
    return this.db().then((client) => client.db().collection(this.collection));
  }
}
