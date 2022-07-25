import { injectable, unmanaged } from "inversify";
import { Filter, MongoClient, ObjectId, WithId } from "mongodb";
import { IConfig } from "../../Interfaces/IConfig";
import {
  findAllOptions,
  FindAllResponse,
  IBaseRepository,
} from "../../App/Repository/IBaseRepository";
import { PartialDeep } from "type-fest";
import { Entity } from "../../App/Entities/Base/Entity";

export type MongoProvider = () => Promise<MongoClient>;

@injectable()
export abstract class MongoBaseRepository<TModel, TEntity extends Entity<any>>
  implements IBaseRepository<TEntity>
{
  constructor(
    @unmanaged() protected collectionName: string,
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

  async findAll({ page, pageSize = 500 }: findAllOptions = {}): Promise<
    FindAllResponse<TEntity>
  > {
    let query = this.getCollection().find();
    if (page) {
      const skip = (page - 1) * pageSize;
      query = query.skip(skip).limit(pageSize);
    }

    const [total, data] = await Promise.all([
      this.getCollection().countDocuments(),
      query.map(this.modelToEntityMapper).toArray(),
    ]);

    return {
      data,
      page: page || 1,
      pageSize: page ? pageSize : total,
      total,
    };
  }

  async save(item: TEntity): Promise<TEntity> {
    const filter = this.getMatchCriteriaFromEntity(item);
    const doc = { $set: item.toRaw() };
    const res = await this.getCollection().updateOne(filter as any, doc, {
      upsert: true,
    });

    const _item = await this.getCollection().findOne(
      filter as unknown as Filter<TModel>
    );

    return this.modelToEntityMapper({
      ...item.toRaw(),
      _id: _item?._id,
    });
  }
}
