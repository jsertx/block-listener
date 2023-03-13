import { inject, injectable } from "inversify";
import { ITxRepository } from "../Repository/ITxRepository";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { IBroker } from "../../Interfaces/IBroker";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { DexSwapTx, EthTransferTx, RawTx, Tx } from "../Entities/Tx";
import { TxType } from "../Values/TxType";
import { isSmartContractCall } from "../Utils/Tx";

import { LogDecoder, TxDecoder } from "@maticnetwork/eth-decoder";
import { ethers } from "ethers";
import { TransactionLog } from "../Types/TransactionLog";
import { allAbiList } from "../Services/SmartContract/ABI";
import { ITxProcessor } from "../Services/TxProcessor/ITxProcessor";
import { TxDiscoveredPayload } from "../PubSub/Messages/TxDiscovered";
import { Subscription } from "../../Infrastructure/Broker/Subscription";
import { WalletDiscovered } from "../PubSub/Messages/WalletDiscovered";
import { TokenDiscovered } from "../PubSub/Messages/TokenDiscovered";
import { IWalletRepository } from "../Repository/IWalletRepository";
import { isSameAddress } from "../Utils/Address";
import { IConfig } from "../../Interfaces/IConfig";
import { Executor } from "../../Infrastructure/Broker/Executor";
import { WalletTagName } from "../Values/WalletTag";
import { AddressRelationType } from "../Entities/Wallet";
import { BN } from "../Utils/Numbers";
import { WalletType } from "../Values/WalletType";
import { Contract } from "../Entities/Contract";
import { ContractType } from "../Values/ContractType";
import { IContractRepository } from "../Repository/IContractRepository";

import { TxSaved } from "../PubSub/Messages/TxSaved";
import { TxProcessedPayload } from "../PubSub/Messages/TxProcessed";

const MIN_DELAY_IN_S = 60;
const backoffStrategy = (retry: number) =>
	(Math.floor(2 ** retry) + MIN_DELAY_IN_S) * 1000;

@injectable()
export class SaveTxOfInterest extends Executor<TxProcessedPayload> {
	constructor(
		@inject(IocKey.Config) private config: IConfig,
		@inject(IocKey.TxRepository) private txRepository: ITxRepository,
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.Broker)
		broker: IBroker,
		@inject(IocKey.Logger) logger: ILogger,
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository
	) {
		super(logger, broker, Subscription.TxProcessed, {
			backoffStrategy
		});
	}
	async execute(msg: TxProcessedPayload) {
		const tx = Tx.create(msg.tx);

		const { saved } = await this.saveTxIfApplies(tx);

		if (saved) {
			await this.broker.publish(new TxSaved(tx.toRaw()));
			this.logger.log({
				type: "save-tx.saved",
				message: `Tx saved: ${tx.hash}@${tx.blockchain}`,
				context: { txHash: tx.hash, blockchain: tx.blockchain.id }
			});
		}
	}

	private async saveTxIfApplies(tx: Tx<any>): Promise<{ saved: boolean }> {
		let saved = false;

		const walletOfTxInDb = await this.walletRepository.findOne({
			blockchain: tx.blockchain.id,
			address: tx.from
		});
		// this should be done inside each handler to do proper side effects of saving it
		if (walletOfTxInDb) {
			await this.txRepository.save(tx);
			return { saved: true };
		}

		switch (tx.type) {
			case TxType.DexSwap:
				saved = await this.saveDexSwapTxHandler(tx);
				break;
			case TxType.EthTransfer:
				saved = await this.saveEthTransferTxHandler(tx);
				break;
		}

		return { saved };
	}
	/* Tx Handlers */
	async saveDexSwapTxHandler(tx: DexSwapTx): Promise<boolean> {
		if (this.isSwapValueUnderThreshold(tx)) {
			return false;
		}

		await this.publishSwapTokens(tx);

		const swapOutAddressIsNotSender = isSameAddress(tx.from, tx.data.to);
		const transferSentRelation = {
			address: tx.data.to,
			type: AddressRelationType.TransferSent,
			metadata: {
				txHash: tx.hash
			}
		};

		await this.broker.publish(
			new WalletDiscovered({
				blockchain: tx.blockchain.id,
				address: tx.from,
				type: WalletType.UnknownWallet,
				tags: [WalletTagName.FoundIteratingBlocks],
				relations: swapOutAddressIsNotSender
					? [transferSentRelation]
					: []
			})
		);

		await this.saveRouterIfNotExist(tx);

		if (swapOutAddressIsNotSender) {
			await this.broker.publish(
				new WalletDiscovered({
					blockchain: tx.blockchain.id,
					address: tx.data.to,
					type: WalletType.UnknownWallet,
					tags: [WalletTagName.FoundByIncomingTransfer],
					relations: [
						{
							address: tx.data.from,
							type: AddressRelationType.TransferReceived,
							metadata: {
								txHash: tx.hash
							}
						}
					]
				})
			);
		}
		await this.txRepository.save(tx);
		return true;
	}

	async saveEthTransferTxHandler(tx: EthTransferTx): Promise<boolean> {
		if (this.isEthTransferValueUnderThreshold(tx)) {
			return false;
		}

		await this.broker.publish(
			new WalletDiscovered({
				blockchain: tx.blockchain.id,
				address: tx.data.from,
				tags: [WalletTagName.FoundIteratingBlocks],
				type: WalletType.UnknownWallet,
				relations: [
					{
						address: tx.data.to,
						type: AddressRelationType.TransferSent,
						metadata: {
							txHash: tx.hash
						}
					}
				]
			})
		);
		// eslint-disable-next-line no-constant-condition
		if (/*opts.saveDestinationAddress*/ false) {
			await this.broker.publish(
				new WalletDiscovered({
					blockchain: tx.blockchain.id,
					address: tx.data.to,
					type: WalletType.UnknownWallet,
					tags: [WalletTagName.FoundByIncomingTransfer],
					relations: [
						{
							address: tx.data.from,
							type: AddressRelationType.TransferReceived,
							metadata: {
								txHash: tx.hash
							}
						}
					]
				})
			);
		}
		await this.txRepository.save(tx);
		return true;
	}

	private isSwapValueUnderThreshold(tx: DexSwapTx): boolean {
		return BN(tx.data.usdValue).lt(
			this.config.txRules[tx.blockchain.id].minDexSwapValueInUsd
		);
	}

	async saveRouterIfNotExist(tx: DexSwapTx): Promise<Contract> {
		let router = await this.contractRepository.findContract(
			tx.raw.to,
			tx.blockchain.id
		);
		if (!router) {
			router = Contract.create({
				address: tx.raw.to,
				blockchain: tx.blockchain.id,
				alias: "unknown-dex.v2.router",
				createdAt: new Date(),
				data: {},
				type: ContractType.UniswapRouterV2Like
			});
			await this.contractRepository.save(router);
			this.logger.warn({
				type: "dex-swap-processor.router-not-found",
				message: "Router not found",
				context: {
					blockchain: tx.blockchain.id,
					txHash: tx.hash,
					address: tx.raw.to
				}
			});
		}

		return router;
	}
	publishSwapTokens(tx: DexSwapTx): Promise<any[]> {
		return Promise.all(
			[tx.data.input.token, tx.data.output.token].map((address) =>
				this.broker.publish(
					new TokenDiscovered({
						blockchain: tx.blockchain.id,
						address
					})
				)
			)
		);
	}
	private isEthTransferValueUnderThreshold(tx: EthTransferTx): boolean {
		return BN(tx.data.usdValue).lt(
			this.config.txRules[tx.blockchain.id].minNativeTransferValueInUsd
		);
	}

	getMessageContextTrace(msg: TxProcessedPayload): any {
		return {
			hash: msg.tx.hash,
			blockchain: msg.tx.blockchain
		};
	}
}
