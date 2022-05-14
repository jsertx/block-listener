import { Tx } from "../../Domain/Entities/Tx";
import { IBaseRepository } from "./IBaseRepository";

export interface ITxRepository extends IBaseRepository<Tx> {}
