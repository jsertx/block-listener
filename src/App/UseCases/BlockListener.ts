import { inject, injectable } from "inversify";

import { IBroker } from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../../Ioc/IocKey";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { BlockReceivedMsg } from "../PubSub/Messages/BlockReceivedMsg";
import { BlockWithTransactions } from "../Types/BlockWithTransactions";

@injectable()
export class BlockListener implements IStandaloneApps {
  protected _blockchain: BlockchainId = BlockchainId.Ethereum;
  protected get blockchain() {
    return new Blockchain(this._blockchain);
  }
  constructor(
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Broker) private broker: IBroker
  ) {}
  get provider() {
    return this.providerFactory.getProvider(this.blockchain);
  }
  async start() {
    this.logger.log({
      type: "block-listener.start",
    });

    this.provider.on("block", this.onBlock.bind(this));
  }
  private async onBlock(blockNumber: number) {
    let block: BlockWithTransactions | undefined = undefined;
    while (!block) {
      block = await this.provider.getBlockWithTransactions(blockNumber);
      if (!block) {
        continue;
      }

      this.broker.publish(
        new BlockReceivedMsg(this.blockchain.id, {
          blockchain: this.blockchain.id,
          block,
        })
      );
      this.logger.log({
        type: "block-listener.new-block",
        context: {
          block: block.number,
        },
      });
    }
  }
}
