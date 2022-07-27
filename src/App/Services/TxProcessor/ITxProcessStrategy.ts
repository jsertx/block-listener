import { Tx } from "../../Entities/Tx";

export interface ITxProcessStrategy {
  process(tx: Tx): Promise<Tx | void>;
}
