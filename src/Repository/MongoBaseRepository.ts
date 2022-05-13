import { injectable, unmanaged } from "inversify";
import { MongoClient, WithId } from "mongodb";
import { IConfig } from "../Interfaces/IConfig";
import { IBaseRepository } from "../Interfaces/Repository/IBaseRepository";

export type MongoProvider = () => Promise<MongoClient>;

@injectable()
export abstract class MongoBaseRepository<Model = any>
  implements IBaseRepository<Model>
{
  constructor(
    @unmanaged() protected collectionName: string,
    @unmanaged() protected client: MongoClient,
    @unmanaged() protected config: IConfig
  ) {}

  protected getCollection() {
    return this.client.db().collection<Model>(this.collectionName);
  }

  async findAll(): Promise<Array<WithId<Model>>> {
    return this.getCollection().find().toArray();
  }

  async save(item: Model): Promise<void> {
    await this.getCollection().insertOne(item as any);
  }
}
