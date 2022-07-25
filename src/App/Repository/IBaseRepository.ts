import { Entity } from "../Entities/Base/Entity";

export interface findAllOptions {
  page?: number;
  pageSize?: number;
}
export interface FindAllResponse<TEntity> {
  page: number;
  pageSize: number;
  total: number;
  data: Array<TEntity>;
}
export interface IBaseRepository<TEntity extends Entity<any>> {
  findAll(options?: findAllOptions): Promise<FindAllResponse<TEntity>>;
  save(item: TEntity): Promise<TEntity>;
  saveIfNotExist(item: TEntity): Promise<TEntity>;
}
