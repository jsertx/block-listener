import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { EthNativeTransferTx } from "../../Domain/Entities/Tx";
import { ITxRepository } from "../../Domain/Repository/ITxRepository";
import { TxType } from "../../Domain/Values/Tx";
import { IConfig } from "../../Interfaces/IConfig";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { Channel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { UnprocessedTx } from "../Models/Tx";

import { toFormatted, toPrecision } from "../Utils/Amount";
import { IListenerUseCase } from "../../Interfaces/IListenerUseCase";

@injectable()
export class SaveEthTx implements IListenerUseCase {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.Config) private config: IConfig,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async listen() {
    this.eventBus.subscribe(Channel.SaveEthTransferTx, this.onNewTx.bind(this));
  }

  async onNewTx({ raw, blockchain }: UnprocessedTx) {
    if (raw.value.lt(toPrecision(this.config.txRules.minEthValue))) {
      return;
    }

    const tx = new EthNativeTransferTx({
      hash: raw.hash,
      type: TxType.EthTransfer,
      blockchain: blockchain.id,
      data: { from: raw.from, to: raw.to!, value: toFormatted(raw.value) },
      raw,
    });

    const saved = await this.txRepository.saveIfNotExist(tx);

    if (saved) {
      this.logger.log({
        type: "save-eth-tx.saved",
        context: { txHash: raw.hash },
      });
    }
  }
}
