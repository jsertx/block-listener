import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { Channel } from "../Enums/Channel";
import { IBroker } from "../Interfaces/IBroker";
import { ILogger } from "../Interfaces/ILogger";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { ITxRepository } from "../Interfaces/Repository/ITxRepository";
import { IocKey } from "../Ioc/IocKey";

@injectable()
export class SaveTransaction {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.Broker) private broker: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async execute() {
    this.broker.subscribe(Channel.Tx, this.onNewTx.bind(this));
  }

  async onNewTx(txRes: ethers.providers.TransactionResponse) {
    const receipt = await this.providerFactory
      .getProvider()
      .getTransactionReceipt(txRes.hash);

    await this.txRepository.save(receipt);

    this.logger.log({
      type: "save-transaction.received",
      context: { txHash: txRes.hash },
    });
  }
}
