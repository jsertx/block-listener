import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { ITxRepository } from "../../Domain/Repository/ITxRepository";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";

import { Channel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { UnprocessedTx } from "../Models/Tx";

@injectable()
export class SaveDexTx {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async execute() {
    this.eventBus.subscribe(Channel.SaveDirectDexTx, this.onNewTx.bind(this));
  }

  async onNewTx(unprocessedTx: UnprocessedTx) {
    //await this.txRepository.save(unprocessedTx);

    this.logger.log({
      type: "save-dex-tx.saved",
      context: { txHash: unprocessedTx.raw.hash },
    });
  }
}
