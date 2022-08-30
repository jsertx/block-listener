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
import { IBlockRepository } from "../Repository/IBlockRepository";
import { Block } from "../Entities/Block";
import BigNumber from "bignumber.js";

@injectable()
export class BlockListener implements IStandaloneApps {
	constructor(
		@inject(IocKey.Config)
		private config: IConfig,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.Broker) private broker: IBroker,
		@inject(IocKey.Cache) private cache: ICache,
		@inject(IocKey.BlockRepository)
		private blockRepository: IBlockRepository
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

			let latestBlock = await this.getStartBlock(blockchain);
			for (;;) {
				const block = await this.getProvider(blockchain)
					.getBlockWithTransactions(
						new BigNumber(latestBlock).toNumber()
					)
					.catch(() => undefined);

				if (block) {
					try {
						await this.blockRepository.save(
							Block.create({
								blockchain,
								height: `${block.number}`,
								timestamp: new Date(block.timestamp * 1000),
								raw: block
							})
						);
						await this.broker.publish(
							new BlockReceived({
								blockchain,
								block
							})
						);

						latestBlock = block.number + 1;

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
	private async getStartBlock(blockchain: BlockchainId): Promise<number> {
		const latestBlockFromDb = await this.blockRepository
			.findLatestBlock(blockchain)
			.then((res) => res?.height);
		if (latestBlockFromDb) {
			return parseInt(latestBlockFromDb);
		}

		return await this.getProvider(blockchain)
			.getBlock("latest")
			.then((res) => res.number);
	}
}
