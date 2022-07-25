import { inject, injectable } from "inversify";

import { IBroker } from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../../Ioc/IocKey";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { EventChannel } from "../Enums/Channel";
import { IListenerUseCase } from "../Interfaces/IListenerUseCase";

@injectable()
export class BlockListener implements IListenerUseCase {
  protected _blockchain: BlockchainId = BlockchainId.Ethereum;
  protected get blockchain() {
    return new Blockchain(this._blockchain);
  }
  constructor(
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.EventBus) private eventBus: IBroker
  ) {}

  async listen() {
    this.logger.log({
      type: "block-listener.start",
    });
    const provider = this.providerFactory.getProvider(this.blockchain);

    provider.on("block", async (blockNumber) => {
      const block = await provider.getBlockWithTransactions(blockNumber);
      this.eventBus.publish(EventChannel.NewBlock, {
        blockchain: this.blockchain,
        block,
      });
      this.logger.log({
        type: "block-listener.new-block",
        context: {
          block: block.number,
        },
      });
    });
  }
}
