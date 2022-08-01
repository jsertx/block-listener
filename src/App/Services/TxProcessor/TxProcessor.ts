import { inject, injectable, multiInject } from "inversify";
import { IocKey } from "../../../Ioc/IocKey";
import { ITxProcessStrategy } from "./ITxProcessStrategy";
import { Tx } from "../../Entities/Tx";
import { ITxRepository } from "../../Repository/ITxRepository";
import { ITxProcessor } from "./ITxProcessor";

@injectable()
export class TxProcessor implements ITxProcessor {
  constructor(
    @multiInject(IocKey.TxProcessorStrategy)
    private txProcessorStrategies: ITxProcessStrategy[]
  ) {}

  async process(tx: Tx<any>) {
    for (const txProcessorStrategy of this.txProcessorStrategies) {
      const processedTx = await txProcessorStrategy.process(tx);
      if (processedTx) {
        return processedTx;
      }
    }
  }
}
