import { inject, injectable } from "inversify";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { EventChannel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";
import { IListenerUseCase } from "../Interfaces/IListenerUseCase";
import { EthNativeTransferData, Tx } from "../Entities/Tx";
import { ITxRepository } from "../Repository/ITxRepository";
import { TxType } from "../Values/Tx";
import { toFormatted } from "../Utils/Amount";

@injectable()
export class ProcessTx implements IListenerUseCase {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.EventBus)
    private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async listen() {
    this.eventBus.subscribe(EventChannel.ProcessTx, this.onNewTx.bind(this));
  }

  async onNewTx(tx: Tx<any>) {
    if (!tx.isSmartContractCall) {
      const data: EthNativeTransferData = {
        from: tx.raw.from,
        to: tx.raw.to,
        value: toFormatted(tx.raw.value),
      };
      tx.setTypeAndData(TxType.EthTransfer, data);
      await this.txRepository.save(tx);
    }
    this.logger.log({
      type: "process-tx.done",
      context: { txHash: tx.hash },
    });
  }
}
