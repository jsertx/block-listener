import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { EthNativeTransferTx, Tx, UnprocessedTx } from "../Domain/Entities/Tx";
import { Channel } from "../Enums/Channel";
import { IBroker } from "../Interfaces/IBroker";
import { IConfig } from "../Interfaces/IConfig";
import { ILogger } from "../Interfaces/ILogger";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IAddressRepository } from "../Interfaces/Repository/IAddressRepository";
import { ITxRepository } from "../Interfaces/Repository/ITxRepository";
import { IocKey } from "../Ioc/IocKey";
import { toFormatted, toPrecision } from "../Utils/Amount";

@injectable()
export class SaveEthTx {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.AddressRepository)
    private addressRepository: IAddressRepository,
    @inject(IocKey.Config) private config: IConfig,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.Broker) private broker: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async execute() {
    this.broker.subscribe(Channel.SaveDirectTokenTx, this.onNewTx.bind(this));
  }

  async onNewTx({ raw, blockchain }: UnprocessedTx) {
    if (raw.value.lt(toPrecision(this.config.txRules.minEthValue))) {
      return;
    }
    const tx: EthNativeTransferTx = {
      blockchain,
      raw,
      data: { from: raw.from, to: raw.to!, value: toFormatted(raw.value) },
    };

    const saved = await this.txRepository.saveIfNotExist(tx, {
      blockchain,
      raw: {
        hash: raw.hash,
      },
    });

    if (saved) {
      this.logger.log({
        type: "save-token-tx.saved",
        context: { txHash: raw.hash },
      });
    }
  }
}
