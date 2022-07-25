import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { ITxRepository } from "../Repository/ITxRepository";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { EventChannel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IListenerUseCase } from "../Interfaces/IListenerUseCase";

@injectable()
export class SaveTokenTx implements IListenerUseCase {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async listen() {
    this.eventBus.subscribe(
      EventChannel.SaveDirectTokenTx,
      this.onNewTx.bind(this)
    );
  }

  async onNewTx(txRes: ethers.providers.TransactionResponse) {
    //    await this.txRepository.save(receipt);

    this.logger.log({
      type: "save-token-tx.saved",
      context: { txHash: txRes.hash },
    });
  }
}
