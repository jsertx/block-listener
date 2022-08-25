import { inject, injectable } from "inversify";

import { IBroker } from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../../Ioc/IocKey";
import { BlockchainId } from "../Values/Blockchain";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { BlockReceived } from "../PubSub/Messages/BlockReceived";
import { IConfig } from "../../Interfaces/IConfig";
import { sleep } from "../Utils/Misc";
import { ICache } from "../Interfaces/ICache";

@injectable()
export class BlockListener implements IStandaloneApps {
	constructor(
		@inject(IocKey.Config)
		private config: IConfig,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.Broker) private broker: IBroker,
		@inject(IocKey.Cache) private cache: ICache
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

			let latestBlock = await this.getProvider(blockchain)
				.getBlock("latest")
				.then((res) => res.number);

			for (;;) {
				const block = await this.getProvider(blockchain)
					.getBlockWithTransactions(latestBlock)
					.catch(() => undefined);

				if (block) {
					try {
						await this.broker.publish(
							new BlockReceived(blockchain, {
								blockchain,
								block
							})
						);
						latestBlock = block.number + 1;
						// TODO: Make it more elegant
						this.cache.set(
							`latest_block_${blockchain}`,
							block.number
						);
						this.logger.log({
							type: "block-listener.new-block",
							context: {
								blockchain,
								blockNumber: block.number
							}
						});
					} catch (error) {
						this.logger.error({
							type: "block-listener.on-block",
							error,
							context: {
								blockchain,
								blockNumber: block.number
							}
						});
					}
				}
				await sleep(10_000);
			}
		});
	}
}
