import { inject, injectable } from "inversify";
import { ITxRepository } from "../Repository/ITxRepository";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";

import { EventChannel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { RawTransaction } from "../Models/RawTransaction";
import { IListenerUseCase } from "../Interfaces/IListenerUseCase";

@injectable()
export class SaveDexTx implements IListenerUseCase {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async listen() {
    this.eventBus.subscribe(
      EventChannel.SaveDirectDexTx,
      this.onNewTx.bind(this)
    );
  }

  async onNewTx(unprocessedTx: RawTransaction) {
    //await this.txRepository.save(unprocessedTx);

    this.logger.log({
      type: "save-dex-tx.saved",
      context: { txHash: unprocessedTx.raw.hash },
    });
  }
}
