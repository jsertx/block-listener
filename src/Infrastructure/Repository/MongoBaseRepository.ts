import { injectable, unmanaged } from "inversify";
import { Filter, MongoClient, WithId } from "mongodb";
import { IConfig } from "../../Interfaces/IConfig";
import {
	findAllOptions,
	FindAllResponse,
	IBaseRepository
} from "../../App/Repository/IBaseRepository";
import { PartialDeep } from "type-fest";
import { Entity } from "../../App/Entities/Base/Entity";

export type MongoProvider = () => Promise<MongoClient>;

@injectable()
export abstract class MongoBaseRepository<
	TModel,
	TEntity extends Entity<any>,
	TId = Record<string, any>
> implements IBaseRepository<TEntity, TId>
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
		return this.client
			.db(this.config.database.database)
			.collection<TModel>(this.collectionName);
	}

	async findAll({
		where,
		page,
		pageSize = 500
	}: findAllOptions = {}): Promise<FindAllResponse<TEntity>> {
		let query = this.getCollection().find(where as any);
		if (page) {
			const skip = (page - 1) * pageSize;
			query = query.skip(skip).limit(pageSize);
		}

		const [total, data] = await Promise.all([
			this.getCollection().countDocuments(),
			query.map(this.modelToEntityMapper).toArray()
		]);

		return {
			data,
			page: page || 1,
			pageSize: page ? pageSize : total,
			total
		};
	}
	async saveMany(items: TEntity[]): Promise<number> {
		if (items.length === 0) {
			return 0;
		}
		const res = await this.getCollection().insertMany(
			items.map((item) => item.toRaw())
		);

		return res.insertedCount;
	}

	findOne(id: TId): Promise<TEntity | undefined> {
		return this.getCollection()
			.findOne(id)
			.then((res) => {
				if (res) {
					return this.modelToEntityMapper(res);
				}
			});
	}

	async save(item: TEntity): Promise<TEntity> {
		const filter = this.getMatchCriteriaFromEntity(item);
		const doc = { $set: item.toRaw() };
		await this.getCollection().updateOne(filter as any, doc, {
			upsert: true
		});

		const _item = await this.getCollection().findOne(
			filter as unknown as Filter<TModel>
		);

		return this.modelToEntityMapper({
			...item.toRaw(),
			_id: _item?._id
		});
	}
}
