import { inject, injectable } from "inversify";
import { Channel } from "../Enums/Channel";
import { IBroker } from "../Interfaces/IBroker";
import { ILogger } from "../Interfaces/ILogger";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../Ioc/IocKey";
import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { isAddreddIn, isSameAddress } from "../Utils/Address";

@injectable()
export class FindDirectTx {
  constructor(
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Broker) private broker: IBroker
  ) {}

  async execute() {
    this.logger.log({
      type: "find-direct-tx.start",
    });
    this.broker.subscribe(Channel.Block, this.onBlock.bind(this));
  }

  async onBlock(block: BlockWithTransactions) {
    const addressesOfInterest = await this.getSmartContractsOfInterest();
    const txs = block.transactions.filter(
      (tx) => tx.to && isAddreddIn(tx.to, addressesOfInterest)
    );

    this.logger.log({
      type: "find-direct-tx.result",
      context: {
        txs: txs.map((tx) => tx.hash),
      },
    });
    await Promise.all(txs.map((tx) => this.broker.publish(Channel.Tx, tx)));
  }

  async getSmartContractsOfInterest() {
    const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    return [uniswapRouterAddress];
  }
}
