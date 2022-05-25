import { PartialDeep } from "type-fest";
import { Entity } from "../Entities/Entity";

export interface IBaseRepository<TEntity extends Entity<any>> {
  findAll(): Promise<Array<TEntity>>;
  save(item: TEntity): Promise<TEntity>;
  saveIfNotExist(item: TEntity): Promise<boolean>;
}
