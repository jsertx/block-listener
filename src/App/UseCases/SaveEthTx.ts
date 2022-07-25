import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { EthNativeTransferTx } from "../Entities/Tx";
import { ITxRepository } from "../Repository/ITxRepository";
import { TxType } from "../Values/Tx";
import { IConfig } from "../../Interfaces/IConfig";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { EventChannel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { RawTransaction } from "../Models/RawTransaction";

import { toFormatted, toPrecision } from "../Utils/Amount";
import { IListenerUseCase } from "../Interfaces/IListenerUseCase";

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
    this.eventBus.subscribe(
      EventChannel.SaveEthTransferTx,
      this.onNewTx.bind(this)
    );
  }

  async onNewTx({ raw: data, blockchain }: RawTransaction) {
    if (data.value.lt(toPrecision(this.config.txRules.minEthValue))) {
      return;
    }

    const tx = new EthNativeTransferTx({
      hash: data.hash,
      type: TxType.EthTransfer,
      blockchain,
      data: { from: data.from, to: data.to!, value: toFormatted(data.value) },
      raw: data,
    });

    const saved = await this.txRepository.saveIfNotExist(tx);

    if (saved) {
      this.logger.log({
        type: "save-eth-tx.saved",
        context: { txHash: data.hash },
      });
    }
  }
}
