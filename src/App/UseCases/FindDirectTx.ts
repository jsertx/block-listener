import { inject, injectable } from "inversify";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { ILogger } from "../../Interfaces/ILogger";
import { IConfig } from "../../Interfaces/IConfig";
import { checksumed, isSameAddress } from "../Utils/Address";
import { isNativeTokenTx } from "../Utils/Tx";
import { IocKey } from "../../Ioc/IocKey";
import { toPrecision } from "../Utils/Amount";
import { IContractRepository } from "../Repository/IContractRepository";
import { IAppBroker } from "../Interfaces/IAppBroker";
import { TxDiscovered } from "../PubSub/Messages/TxDiscovered";
import { BlockReceivedPayload } from "../PubSub/Messages/BlockReceived";
import { Subscription } from "../../Infrastructure/Broker/Subscription";
import { IWalletRepository } from "../Repository/IWalletRepository";
import { Contract } from "../Entities/Contract";
import { BlockchainId } from "../Values/Blockchain";
import { Executor } from "../../Infrastructure/Broker/Executor";
import { ICache } from "../Interfaces/ICache";

const contractCacheKey = (blockchain: string) =>
	`find_direct_tx_contracts_${blockchain}`;

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
		private cache: ICache
	) {
		super(logger, broker, Subscription.FindDirectTx, {});
	}

	async execute({ block, blockchain }: BlockReceivedPayload): Promise<void> {
		for (const tx of block.transactions) {
			const conditions = Promise.all([
				this.isBigNativeTx(blockchain, tx),
				this.isAgainstContractOfInterest(blockchain, tx),
				this.isDoneByTrackedWallet(blockchain, tx)
			]);

			const shouldPublish = await conditions.then((res) =>
				res.some((truthy) => truthy)
			);

			if (shouldPublish) {
				const blockWithoutTxsData = {
					...block,
					transactions: block.transactions.map((t) => t.hash)
				};
				this.broker.publish(
					new TxDiscovered(blockchain, {
						blockchain,
						hash: tx.hash,
						txRes: tx,
						block: blockWithoutTxsData
					})
				);
			}
		}
	}

	private isBigNativeTx(
		blockchain: BlockchainId,
		tx: ethers.providers.TransactionResponse
	): boolean {
		return (
			isNativeTokenTx(tx) &&
			new BigNumber(tx.value._hex).isGreaterThanOrEqualTo(
				toPrecision(
					this.config.txRules[blockchain].minNativeTransferValue
				)
			)
		);
	}

	private async isDoneByTrackedWallet(
		blockchain: BlockchainId,
		txRes: ethers.providers.TransactionResponse
	): Promise<boolean> {
		const wallet = await this.walletRepository.findOne({
			address: checksumed(txRes.from),
			blockchain
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

		await this.cache.set(cacheKey, fromDb.data);
		return fromDb.data;
	}
}
