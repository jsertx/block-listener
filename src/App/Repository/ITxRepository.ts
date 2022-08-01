import { Tx, TxIdProps } from "../Entities/Tx";
import { IBaseRepository } from "./IBaseRepository";

export type ITxRepository = IBaseRepository<Tx<any>, TxIdProps>;
