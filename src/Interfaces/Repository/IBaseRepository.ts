import { WithId } from "mongodb";

export interface IBaseRepository<Model> {
  findAll(): Promise<Array<WithId<Model>>>;
  save(item: Model): Promise<void>;
}
