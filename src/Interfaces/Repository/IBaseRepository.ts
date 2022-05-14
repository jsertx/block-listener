import { WithId } from "mongodb";
import { PartialDeep } from "type-fest";

export interface IBaseRepository<Model> {
  findAll(): Promise<Array<WithId<Model>>>;
  save(item: Model): Promise<void>;
  saveIfNotExist(
    item: Model,
    matchCriteria: PartialDeep<Model>
  ): Promise<boolean>;
}
