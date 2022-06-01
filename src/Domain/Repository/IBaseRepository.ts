import { Entity } from "../Entities/Base/Entity";

export interface IBaseRepository<TEntity extends Entity<any>> {
  findAll(): Promise<Array<TEntity>>;
  save(item: TEntity): Promise<TEntity>;
  saveIfNotExist(item: TEntity): Promise<TEntity>;
}
