import { inject, injectable } from "inversify";

import { IBroker } from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../../Ioc/IocKey";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { BlockReceived } from "../PubSub/Messages/BlockReceived";
import { IConfig } from "../../Interfaces/IConfig";
import { noop, sleep } from "../Utils/Misc";
import { IBlockRepository } from "../Repository/IBlockRepository";
import { Block } from "../Entities/Block";
import { IPriceService } from "../Interfaces/IPriceService";
import { Subscription } from "../../Infrastructure/Broker/Subscription";

@injectable()
export class BlockListener implements IStandaloneApps {
	constructor(
		@inject(IocKey.Config)
		private config: IConfig,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.Broker) private broker: IBroker,
		@inject(IocKey.BlockRepository)
		private blockRepository: IBlockRepository,
		@inject(IocKey.PriceService) private priceService: IPriceService
	) {}

	private getProvider(blockchain: BlockchainId) {
		return this.providerFactory.getProvider(blockchain);
	}
	async start() {
		this.config.enabledBlockchains.forEach(async (blockchain) => {
			this.logger.log({
				message: `BlockListener started @${blockchain}`,
				type: "block-listener.start",
				context: {
					blockchain
				}
			});

			const latestBlock = await this.getStartBlock(blockchain);
			let nextBlockNum = latestBlock + 1;
			for (;;) {
				const block = await this.getProvider(blockchain)
					.getBlockWithTransactions(nextBlockNum)
					.catch(() => undefined);

				if (block) {
					try {
						await this.blockRepository.save(
							Block.create({
								blockchain,
								height: `${block.number}`,
								timestamp: new Date(block.timestamp * 1000)
							})
						);

						await this.prepareNextBlockPriceCache(
							blockchain,
							nextBlockNum
						).catch(noop);

						await this.broker.publish(
							new BlockReceived({
								blockchain,
								block
							})
						);

						nextBlockNum = block.number + 1;

						this.logger.log({
							type: "block-listener.new-block.saved",
							message: `Block fetched ${block.number}@${blockchain}`,
							context: {
								blockchain,
								blockNumber: block.number
							}
						});
					} catch (error) {
						this.logger.error({
							type: "block-listener.new-block.error",
							message: `Error getting block ${block.number}@${blockchain}`,
							error,
							context: {
								blockchain,
								blockNumber: block.number
							}
						});
					}
				}
				await this.nextRoundAwaiter();
			}
		});
	}

	private async nextRoundAwaiter() {
		for (;;) {
			const pendingSaveTxMsgs = await this.broker.getPendingMessages(
				Subscription.SaveTx
			);
			// few messages = stop waiting after 10s
			if (pendingSaveTxMsgs < 1000) {
				return sleep(10_000);
			}
			// many messages = wait 2 min and check again
			this.logger.log({
				message: `Channel ${Subscription.SaveTx} has ${pendingSaveTxMsgs} msgs. Waiting to cool down.`,
				type: "block-listener.new-block.cool-down"
			});
			await sleep(120_000);
		}
	}
	private async prepareNextBlockPriceCache(
		blockchain: BlockchainId,
		latestBlock: number
	) {
		await this.priceService.getBlockchainNativeTokenUsdPrice(
			new Blockchain(blockchain),
			latestBlock
		);
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
