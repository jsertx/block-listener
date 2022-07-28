import { Tx, TxIdProps } from "../Entities/Tx";
import { IBaseRepository } from "./IBaseRepository";

export interface ITxRepository extends IBaseRepository<Tx<any>, TxIdProps> {}
