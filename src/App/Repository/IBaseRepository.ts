import { PartialDeep } from "type-fest";
import { Entity } from "../Entities/Base/Entity";

export interface findAllOptions<T = any> {
	where?: PartialDeep<T>;
	page?: number;
	pageSize?: number;
}

export interface FindAllResponse<TEntity> {
	page: number;
	pageSize: number;
	total: number;
	data: Array<TEntity>;
}
export interface IBaseRepository<
	TEntity extends Entity<any>,
	TId extends Record<string, any>
> {
	findOne(
		id: TId & PartialDeep<TEntity["props"]>
	): Promise<TEntity | undefined>;
	findAll(
		options?: findAllOptions<TEntity["props"]>
	): Promise<FindAllResponse<TEntity>>;
	save(item: TEntity): Promise<TEntity>;
	saveMany(items: TEntity[]): Promise<number>;
}
