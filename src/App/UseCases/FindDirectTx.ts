import { inject, injectable } from "inversify";
import { ethers } from "ethers";
import { ILogger } from "../../Interfaces/ILogger";
import { IConfig } from "../../Interfaces/IConfig";
import { checksumed, isSameAddress } from "../Utils/Address";
import { isNativeTokenTx } from "../Utils/Tx";
import { IocKey } from "../../Ioc/IocKey";
import { IContractRepository } from "../Repository/IContractRepository";
import { IAppBroker } from "../Interfaces/IAppBroker";
import { TxDiscovered } from "../PubSub/Messages/TxDiscovered";
import { BlockReceivedPayload } from "../PubSub/Messages/BlockReceived";
import { Subscription } from "../../Infrastructure/Broker/Subscription";
import { IWalletRepository } from "../Repository/IWalletRepository";
import { Contract } from "../Entities/Contract";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { Executor } from "../../Infrastructure/Broker/Executor";
import { ICache } from "../Interfaces/ICache";
import { WalletType } from "../Values/WalletType";
import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { IPriceService } from "../Interfaces/IPriceService";
import { toFormatted } from "../Utils/Amount";
import { BN } from "../Utils/Numbers";
import { IProviderFactory } from "../Interfaces/IProviderFactory";

const contractCacheKey = (blockchain: string) =>
	`find_direct_tx_contracts_${blockchain}`;

const contractCacheDurationInSecs = 3600;
@injectable()
export class FindDirectTx extends Executor<BlockReceivedPayload> {
	constructor(
		@inject(IocKey.Logger) logger: ILogger,
		@inject(IocKey.Config) private config: IConfig,
		@inject(IocKey.Broker) broker: IAppBroker,
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository,
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.Cache)
		private cache: ICache,
		@inject(IocKey.PriceService)
		private priceService: IPriceService,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory
	) {
		super(logger, broker, Subscription.FindDirectTx, {});
	}

	async execute({ block, blockchain }: BlockReceivedPayload): Promise<void> {
		const receipts = await this.getTransactionReceipts({
			block,
			blockchain
		});
		for (const tx of block.transactions) {
			const txReceipt = receipts.find(
				(receipt) =>
					receipt.transactionHash.toLowerCase() ===
					tx.hash.toLowerCase()
			);

			const shouldPublish = await this.shouldPublishTx();
			if (shouldPublish) {
				const blockWithoutTxsData = {
					...block,
					transactions: block.transactions.map((t) => t.hash)
				};
				await this.broker.publish(
					new TxDiscovered({
						blockchain,
						hash: tx.hash,
						txRes: tx,
						txReceipt,
						block: blockWithoutTxsData
					})
				);
			}
		}
	}
	private async shouldPublishTx(): Promise<boolean> {
		// const publishConditions = Promise.all([
		// 	this.isNativeTransferOverThreshold(blockchain, tx, block), //isNativeTokenTx(tx),
		// 	this.isAgainstContractOfInterest(blockchain, tx),
		// 	this.isDoneByTrackedWallet(blockchain, tx)
		// ]);

		// const shouldPublish = await publishConditions.then((res) =>
		// 	res.some((truthy) => truthy)
		// );

		return true;
	}
	private async isDoneByTrackedWallet(
		blockchain: BlockchainId,
		txRes: ethers.providers.TransactionResponse
	): Promise<boolean> {
		const wallet = await this.walletRepository.findOne({
			address: checksumed(txRes.from),
			blockchain,
			type: WalletType.Whale
		});
		return !!wallet;
	}

	private async isAgainstContractOfInterest(
		blockchain: BlockchainId,
		txRes: ethers.providers.TransactionResponse
	): Promise<boolean> {
		const addressesOfInterest = await this.getContracts(blockchain);
		return addressesOfInterest.some((contract) =>
			isSameAddress(contract.address, txRes.to)
		);
	}

	async getContracts(blockchain: BlockchainId): Promise<Contract[]> {
		const cacheKey = contractCacheKey(blockchain);
		const fromCache = await this.cache.get<Contract[]>(cacheKey);
		if (fromCache) {
			return fromCache;
		}

		const fromDb = await this.contractRepository.findAll({
			where: { blockchain }
		});

		await this.cache.set(
			cacheKey,
			fromDb.data,
			contractCacheDurationInSecs
		);
		return fromDb.data;
	}
	private async isNativeTransferOverThreshold(
		blockchain: BlockchainId,
		tx: ethers.providers.TransactionResponse,
		block: BlockWithTransactions
	) {
		if (!isNativeTokenTx(tx)) {
			return false;
		}
		const amount = toFormatted(BN(tx.value).toString());
		const usdValue =
			await this.priceService.getBlockchainNativeTokenUsdValue(
				new Blockchain(blockchain),
				amount,
				block.timestamp * 1000
			);
		return BN(usdValue).isGreaterThanOrEqualTo(
			this.config.txRules[blockchain].minNativeTransferValueInUsd
		);
	}
	getMessageContextTrace({ block, blockchain }: BlockReceivedPayload): any {
		return {
			block: block.number,
			blockchain
		};
	}
	async getTransactionReceipts({
		block,
		blockchain
	}: Pick<BlockReceivedPayload, "block" | "blockchain">): Promise<
		ethers.providers.TransactionReceipt[]
	> {
		try {
			const provider = await this.providerFactory.getProvider(blockchain);
			const blockNumberHex = `0x${Number(block.number).toString(16)}`;
			const rawReceipts: any[] = await provider.send(
				"alchemy_getTransactionReceipts",
				[
					{
						blockNumber: blockNumberHex
					}
				]
			);

			return rawReceipts.map(mapRawReceiptToTxReceipt(block));
		} catch (error) {
			return [];
		}
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
