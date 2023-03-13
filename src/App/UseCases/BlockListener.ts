import { inject, injectable } from "inversify";

import { IBroker } from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";

import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IocKey } from "../../Ioc/IocKey";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { IConfig } from "../../Interfaces/IConfig";
import { noop, sleep } from "../Utils/Misc";
import { IBlockRepository } from "../Repository/IBlockRepository";
import { Block } from "../Entities/Block";
import { IPriceService } from "../Interfaces/IPriceService";
import { Subscription } from "../../Infrastructure/Broker/Subscription";
import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { ethers } from "ethers";
import { TxDiscovered } from "../PubSub/Messages/TxDiscovered";

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
		this.config.enabledBlockchains.forEach(this.startBlockchainListener);
	}

	private async startBlockchainListener(blockchain: BlockchainId) {
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
			const provider = await this.getProvider(blockchain);
			const block = await provider
				.getBlockWithTransactions(nextBlockNum)
				.catch(() => undefined);

			if (!block) {
				await this.nextRoundAwaiter().catch(noop);
				continue;
			}
			try {
				const [_, txDiscoveredEvents] = await Promise.all([
					this.nativeTokenPriceCacheController(
						block,
						blockchain,
						nextBlockNum
					),
					this.getTxDiscoveredEvents(block, blockchain)
				]);

				await Promise.all(
					txDiscoveredEvents.map((txDiscoveredEvent) => {
						return this.broker.publish(txDiscoveredEvent);
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
	}

	private async getTxDiscoveredEvents(
		block: BlockWithTransactions,
		blockchain: BlockchainId
	): Promise<TxDiscovered[]> {
		const receipts = await this.getTransactionReceipts(block, blockchain);
		return block.transactions.map((tx) => {
			const txReceipt = receipts.find(
				(receipt) =>
					receipt.transactionHash.toLowerCase() ===
					tx.hash.toLowerCase()
			);

			const blockWithoutTxsData = {
				...block,
				transactions: block.transactions.map((t) => t.hash)
			};
			return new TxDiscovered({
				blockchain,
				hash: tx.hash,
				txRes: tx,
				txReceipt,
				block: blockWithoutTxsData,
				saveDestinationAddress: true
			});
		});
	}

	private async getTransactionReceipts(
		block: BlockWithTransactions,
		blockchain: BlockchainId
	): Promise<ethers.providers.TransactionReceipt[]> {
		try {
			const provider = await this.providerFactory.getProvider(blockchain);
			const blockNumberHex = `0x${Number(block.number).toString(16)}`;
			const rawReceipts: { receipts: any[] } = await provider.send(
				"alchemy_getTransactionReceipts",
				[
					{
						blockNumber: blockNumberHex
					}
				]
			);
			return rawReceipts.receipts.map(mapRawReceiptToTxReceipt(block));
		} catch (error) {
			return [];
		}
	}
	private async nextRoundAwaiter() {
		for (;;) {
			const pendingSaveTxMsgs = await this.broker.getPendingMessages(
				Subscription.DiscoveredTxToProcess
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
				message: `Channel ${Subscription.DiscoveredTxToProcess} has ${pendingSaveTxMsgs} msgs. Waiting to cool down.`,
				type: "block-listener.new-block.cool-down"
			});
			await sleep(60_000);
		}
	}

	private async nativeTokenPriceCacheController(
		block: BlockWithTransactions,
		blockchain: BlockchainId,
		latestBlock: number
	) {
		const cachePriceAfterBlocks = 50;
		const shouldNotPrepareCache =
			block.number % cachePriceAfterBlocks !== 0;

		if (shouldNotPrepareCache) {
			return;
		}
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

function mapRawReceiptToTxReceipt(block: BlockWithTransactions) {
	return (r: Record<string, any>): ethers.providers.TransactionReceipt => {
		return {
			to: r.to,
			from: r.from,
			contractAddress: r.contractAddress,
			transactionIndex: Number(r.transactionIndex),
			root: "", // never minds at the moment
			gasUsed: ethers.BigNumber.from(r.gasUsed),
			logsBloom: r.logsBloom,
			blockHash: r.blockHash,
			transactionHash: r.transactionHash,
			logs: r.logs.map((l: any) => ({
				...l,
				logIndex: Number(l.logIndex),
				transactionIndex: Number(l.transactionIndex)
			})),
			blockNumber: block.number,
			confirmations: 1, //never mind at the moment
			cumulativeGasUsed: ethers.BigNumber.from(r.cumulativeGasUsed),
			effectiveGasPrice: ethers.BigNumber.from(r.effectiveGasPrice),
			byzantium: true, // never mind at the moment
			type: Number(r.type),
			status: Number(r.status)
		};
	};
}
