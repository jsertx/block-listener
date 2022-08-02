import { inject, injectable } from "inversify";

import { IBroker } from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../../Ioc/IocKey";
import { BlockchainId } from "../Values/Blockchain";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { BlockReceived } from "../PubSub/Messages/BlockReceived";
import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { IConfig } from "../../Interfaces/IConfig";

@injectable()
export class BlockListener implements IStandaloneApps {
	constructor(
		@inject(IocKey.Config)
		private config: IConfig,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.Broker) private broker: IBroker
	) {}

	private getProvider(blockchain: BlockchainId) {
		return this.providerFactory.getProvider(blockchain);
	}
	async start() {
		this.config.enabledBlockchains.forEach((blockchain) => {
			this.logger.log({
				type: "block-listener.start",
				context: {
					blockchain
				}
			});

			this.getProvider(blockchain).on("block", (blockNumber) => {
				this.onBlock(blockchain, blockNumber);
			});
		});
	}
	private async onBlock(blockchain: BlockchainId, blockNumber: number) {
		let block: BlockWithTransactions | undefined = undefined;
		while (!block) {
			block = await this.getProvider(blockchain).getBlockWithTransactions(
				blockNumber
			);
			if (!block) {
				continue;
			}

			this.broker.publish(
				new BlockReceived(blockchain, {
					blockchain,
					block
				})
			);
			this.logger.log({
				type: "block-listener.new-block",
				context: {
					block: block.number
				}
			});
		}
	}
}
