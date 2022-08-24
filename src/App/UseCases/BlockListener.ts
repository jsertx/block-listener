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
import { sleep } from "../Utils/Misc";

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
		this.config.enabledBlockchains.forEach(async (blockchain) => {
			this.logger.log({
				type: "block-listener.start",
				context: {
					blockchain
				}
			});
			const provider = this.getProvider(blockchain);
			let latestBlock = await provider
				.getBlock("latest")
				.then((res) => res.number);

			for (;;) {
				const newBlock = await provider.getBlock(latestBlock);

				if (newBlock) {
					try {
						await this.onBlock(blockchain, newBlock.number);
						latestBlock += 1;
					} catch (error) {
						this.logger.error({
							type: "block-listener.on-block",
							error,
							context: {
								blockchain,
								blockNumber: newBlock.number
							}
						});
					}
				}
				await sleep(5_000);
			}
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
					blockNumber: block.number
				}
			});
		}
	}
}
