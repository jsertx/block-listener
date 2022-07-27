import { Tx } from "../../Entities/Tx";

export interface ITxProcessor {
  process(tx: Tx): Promise<Tx | void>;
}
