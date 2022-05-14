import { inject, injectable } from "inversify";
import { Blockchain } from "../Domain/Values/Blockchain";
import { createUnprocessedTx } from "../Domain/Mappers/TxMappers";
import { Channel } from "../Enums/Channel";
import { IBroker } from "../Interfaces/IBroker";
import { ILogger } from "../Interfaces/ILogger";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../Ioc/IocKey";

@injectable()
export class BlockListener {
  protected blockchain: Blockchain = Blockchain.Ethereum;
  constructor(
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Broker) private broker: IBroker
  ) {}

  async execute() {
    this.logger.log({
      type: "block-listener.start",
    });
    const provider = this.providerFactory.getProvider(this.blockchain);
    provider.on("block", async (blockNumber) => {
      const block = await provider.getBlockWithTransactions(blockNumber);

      for (const raw of block.transactions) {
        this.broker.publish(
          Channel.ProcessTx,
          createUnprocessedTx({ raw, blockchain: this.blockchain })
        );
      }
      this.logger.log({
        type: "block-listener.new-block",
        context: {
          block: block.number,
        },
      });
    });
  }
}
