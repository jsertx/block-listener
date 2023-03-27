import { injectable, unmanaged } from "inversify";
import { Document, MongoClient, WithId } from "mongodb";
import { IConfig } from "../../Interfaces/IConfig";
import { Entity } from "../../App/Entities/Base/Entity";
import { MongoBaseRepository } from "./MongoBaseRepository";
import { ICache } from "../../App/Interfaces/ICache";

export type MongoProvider = () => Promise<MongoClient>;

@injectable()
export abstract class CachedMongoBaseRepository<
	TModel extends Document,
	TEntity extends Entity<any>,
	TId extends Record<string, any> = Record<string, any>
> extends MongoBaseRepository<TModel, TEntity, TId> {
	constructor(
		@unmanaged() protected collectionName: string,
		@unmanaged()
		protected client: MongoClient,
		@unmanaged() protected config: IConfig,
		@unmanaged() protected cache: ICache
	) {
		super(collectionName, client, config);
	}

	getEntityId(id: TId): string {
		return Object.values(id).join("_");
	}

	private getCacheKey(id: TId): string {
		return `repo.cache.${this.collectionName}.${this.getEntityId(id)}`;
	}

	async findOne(id: TId): Promise<TEntity | undefined> {
		const cachedProps = await this.cache.get<WithId<TModel>>(
			this.getCacheKey(id)
		);
		if (cachedProps) {
			return this.modelToEntityMapper(cachedProps);
		}
		const res = await super.findOne(id);

		if (res) {
			await this.cache.set(this.getCacheKey(id), res.props);
		}

		return res;
	}
	async save(item: TEntity): Promise<TEntity> {
		const res = await super.save(item);
		if (res) {
			await this.cache.set(this.getCacheKey(res.props), res.props);
		}
		return res;
	}
}
