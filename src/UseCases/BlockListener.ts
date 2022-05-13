import { ethers } from "ethers";
import EventEmitter from "eventemitter3";
import { inject, injectable } from "inversify";
import { Channel } from "../Enums/Channel";
import { IBroker } from "../Interfaces/IBroker";
import { ILogger } from "../Interfaces/ILogger";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../Ioc/IocKey";

@injectable()
export class BlockListener {
  constructor(
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Broker) private broker: IBroker
  ) {}

  async execute() {
    this.logger.log({
      type: "block-listener.start",
    });
    const provider = this.providerFactory.getProvider();
    provider.on("block", async (blockNumber) => {
      const block = await provider.getBlockWithTransactions(blockNumber);
      await this.broker.publish(Channel.Block, block);

      this.logger.log({
        type: "block-listener.new-block",
        context: {
          block: block.number,
        },
      });
    });
  }

  getLogs() {}
}
