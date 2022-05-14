import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { UnprocessedTx } from "../Domain/Entities/Tx";
import { Channel } from "../Enums/Channel";
import { IBroker } from "../Interfaces/IBroker";
import { ILogger } from "../Interfaces/ILogger";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { ITxRepository } from "../Interfaces/Repository/ITxRepository";
import { IocKey } from "../Ioc/IocKey";

@injectable()
export class SaveDexTx {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.Broker) private broker: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async execute() {
    this.broker.subscribe(Channel.SaveDirectDexTx, this.onNewTx.bind(this));
  }

  async onNewTx(unprocessedTx: UnprocessedTx) {
    //await this.txRepository.save(unprocessedTx);

    this.logger.log({
      type: "save-dex-tx.saved",
      context: { txHash: unprocessedTx.raw.hash },
    });
  }
}
