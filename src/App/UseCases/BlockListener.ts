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
import { Axios } from "axios";
import { WebhookClient } from "discord.js";

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
		this.startNotifier();
		this.config.enabledBlockchains.forEach(async (blockchain) => {
			this.logger.log({
				message: `BlockListener started @${blockchain}`,
				type: "block-listener.start",
				context: {
					blockchain
				}
			});

			const cachePriceAfterBlocks = 50;
			const latestBlock = await this.getStartBlock(blockchain);
			let nextBlockNum = latestBlock + 1;
			for (;;) {
				const provider = await this.getProvider(blockchain);
				const block = await provider
					.getBlockWithTransactions(nextBlockNum)
					.catch(() => undefined);

				if (block) {
					try {
						if (block.number % cachePriceAfterBlocks === 0) {
							await this.prepareNextBlockPriceCache(
								blockchain,
								nextBlockNum
							).catch(noop);
						}

						await this.broker.publish(
							new BlockReceived({
								blockchain,
								block
							})
						);
						await this.blockRepository.save(
							Block.create({
								blockchain,
								height: `${block.number}`,
								timestamp: new Date(block.timestamp * 1000)
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
				await this.nextRoundAwaiter().catch(noop);
			}
		});
	}

	private startNotifier() {
		const client = new Axios({
			baseURL: "http://localhost"
		});

		const discord = new WebhookClient({
			url: this.config.discord.blockListenerStatusChannelHook
		});
		const sendNotification = async () => {
			const content = await client
				.get("/")
				.catch((error) => {
					throw error;
				})
				.then((res) => res.data)
				.then(JSON.parse)
				.then(buildStatusMessageFromApi);

			discord
				.send({
					content,
					username: "blocklistener-snitch",
					avatarURL: "https://i.imgur.com/dBAMyiR.jpeg"
				})
				.then((res) => {
					this.logger.log({
						type: "notifications.discord.success",
						message: "Discord notification sent successfully"
					});
				})
				.catch((error) => {
					this.logger.error({
						type: "notifications.discord.failure",
						message: error?.message || "Unknown error"
					});
				});
		};
		setInterval(sendNotification, 3600 * 24 * 1000);
		sendNotification().then(noop).catch(noop);
	}

	private async nextRoundAwaiter() {
		for (;;) {
			const pendingSaveTxMsgs = await this.broker.getPendingMessages(
				Subscription.SaveTx
			);
			// few messages = stop waiting after 10s
			if (
				pendingSaveTxMsgs <
				this.config.blockListener.maxSaveTxMessagesToHalt
			) {
				return; // sleep(0000);
			}
			// many messages = wait 2 min and check again
			this.logger.log({
				message: `Channel ${Subscription.SaveTx} has ${pendingSaveTxMsgs} msgs. Waiting to cool down.`,
				type: "block-listener.new-block.cool-down"
			});
			await sleep(60_000);
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
		const provider = await this.getProvider(blockchain);
		return await provider
			.getBlock(this.config.blockListener.defaultStartingBlock)
			.then((res) => res.number);
	}
}

function buildStatusMessageFromApi(res: any) {
	const msg = Object.entries(res.data.latestBlocks).reduce(
		(msg, [chain, data]: [any, any]) => {
			msg += `\n[${chain.toUpperCase()}]`;
			msg += `\nHeight: ${data.height}`;
			msg += `\nDate: ${data.timestamp}`;
			msg += `\nLink: ${data.link}`;
			return msg;
		},
		"BlockListener Status:"
	);
	const statusMsg = Object.entries(res.data.broker).reduce(
		(msg, [queue, status]: [any, any]) => {
			if (status.dead === 0) {
				return msg;
			}
			return `${msg}\n${queue}: ${status.dead}`;
		},
		"Broker Dead Messages:"
	);

	return `${msg}\n\n${statusMsg}\n\n#blocklistener #status`;
}
