import { injectable, unmanaged } from "inversify";
import { MongoClient, WithId } from "mongodb";
import { IConfig } from "../../App/Interfaces/IConfig";
import { IBaseRepository } from "../../Domain/Repository/IBaseRepository";
import { PartialDeep } from "type-fest";
import { Entity } from "../../Domain/Entities/Entity";

export type MongoProvider = () => Promise<MongoClient>;

@injectable()
export abstract class MongoBaseRepository<TModel, TEntity extends Entity<any>>
  implements IBaseRepository<TEntity>
{
  constructor(
    @unmanaged() protected collectionName: string,
    @unmanaged()
    @unmanaged()
    protected client: MongoClient,
    @unmanaged() protected config: IConfig
  ) {}

  protected abstract modelToEntityMapper(model: WithId<TModel>): TEntity;
  protected abstract getMatchCriteriaFromEntity(
    entity: TEntity
  ): PartialDeep<TModel>;

  protected getCollection() {
    return this.client.db().collection<TModel>(this.collectionName);
  }

  async findAll(): Promise<TEntity[]> {
    return this.getCollection().find().map(this.modelToEntityMapper).toArray();
  }

  async save(item: TEntity): Promise<TEntity> {
    const { insertedId } = await this.getCollection().insertOne(item.toRaw());

    return this.modelToEntityMapper({ ...item.toRaw(), _id: insertedId });
  }

  async saveIfNotExist(item: TEntity): Promise<boolean> {
    const matchCriteria = this.getMatchCriteriaFromEntity(item);
    return this.getCollection()
      .updateOne(
        matchCriteria as any,
        {
          $setOnInsert: item.toRaw(),
        },
        { upsert: true }
      )
      .then((res) => res.matchedCount === 0);
  }
}
