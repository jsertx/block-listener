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
import { checksumed } from "../Utils/Address";
import { IConfig } from "../../Interfaces/IConfig";
import { DirectToDead, Executor } from "../../Infrastructure/Broker/Executor";
import { WalletTagName } from "../Values/WalletTag";
import { AddressRelationType } from "../Entities/Wallet";
import { isUndefined } from "../Utils/Misc";
import { BN } from "../Utils/Numbers";
import { WalletType } from "../Values/WalletType";
import { Contract } from "../Entities/Contract";
import { ContractType } from "../Values/ContractType";
import { IContractRepository } from "../Repository/IContractRepository";

const MIN_DELAY_IN_S = 60;
const backoffStrategy = (retry: number) =>
	(Math.floor(2 ** retry) + MIN_DELAY_IN_S) * 1000;

@injectable()
export class SaveTx extends Executor<TxDiscoveredPayload> {
	constructor(
		@inject(IocKey.Config) private config: IConfig,
		@inject(IocKey.TxRepository) private txRepository: ITxRepository,
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Broker) broker: IBroker,
		@inject(IocKey.Logger) logger: ILogger,
		@inject(IocKey.TxProcessor) private txProcessor: ITxProcessor,
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository
	) {
		super(logger, broker, Subscription.SaveTx, { backoffStrategy });
	}
	async execute(msg: TxDiscoveredPayload) {
		const { blockchain, hash, saveUnknown } = msg;
		const existingTx = await this.txRepository.findOne({
			blockchain: msg.blockchain,
			hash: msg.hash
		});
		if (existingTx) {
			return;
		}

		const successfullTx = await this.getRawTransaction(msg);

		if (!successfullTx) {
			return;
		}

		let tx = Tx.create({
			blockchain,
			hash,
			data: undefined,
			raw: successfullTx,
			type: TxType.Unknown
		});
		const processedTx = await this.txProcessor.process(tx);

		if (processedTx) {
			tx = processedTx;
		} else if (!saveUnknown) {
			return;
		}

		const { saved } = await this.saveTxIfApplies(tx);
		if (saved) {
			this.logger.log({
				type: "save-tx.saved",
				message: `Tx saved: ${hash}@${blockchain}`,
				context: { txHash: hash, blockchain }
			});
		}
	}

	private async saveTxIfApplies(tx: Tx<any>): Promise<{ saved: boolean }> {
		let saved = false;

		/*
		// TODO: disabled because we dont need it yet
		const walletOfTxInDb = await this.walletRepository.findOne({
			blockchain: tx.blockchain.id,
			address: tx.from
		});
		if (walletOfTxInDb) {
			await this.txRepository.save(tx);
			return { saved: true };
		}
		*/

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

	async saveDexSwapTxHandler(tx: DexSwapTx): Promise<boolean> {
		if (
			BN(tx.data.usdValue).lt(
				this.config.txRules[tx.blockchain.id].minDexSwapValueInUsd
			)
		) {
			return false;
		}

		await Promise.all(
			[tx.data.input.token, tx.data.output.token].map((address) =>
				this.broker.publish(
					new TokenDiscovered({
						blockchain: tx.blockchain.id,
						address
					})
				)
			)
		);
		const swapOutAddressIsNotSender = tx.from !== tx.data.to;
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
				type: WalletType.Whale,
				tags: [WalletTagName.FoundIteratingBlocks],
				relations: swapOutAddressIsNotSender
					? [transferSentRelation]
					: []
			})
		);

		const router = await this.contractRepository.findContract(
			tx.raw.to,
			tx.blockchain.id
		);
		if (!router) {
			await this.contractRepository.save(
				Contract.create({
					address: tx.raw.to,
					blockchain: tx.blockchain.id,
					alias: "unknown-dex.v2.router",
					createdAt: new Date(),
					data: {},
					type: ContractType.UniswapRouterV2Like
				})
			);
			// maybe just set dex to unknown
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
		if (
			BN(tx.data.usdValue).lt(
				this.config.txRules[tx.blockchain.id]
					.minNativeTransferValueInUsd
			)
		) {
			return false;
		}

		await Promise.all([
			this.broker.publish(
				new WalletDiscovered({
					blockchain: tx.blockchain.id,
					address: tx.data.from,
					tags: [WalletTagName.FoundIteratingBlocks],
					type: WalletType.Whale,
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
			),
			this.broker.publish(
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
			)
		]);
		await this.txRepository.save(tx);
		return true;
	}

	private async getRawTransaction({
		blockchain,
		hash,
		txRes,
		block
	}: TxDiscoveredPayload): Promise<RawTx | undefined> {
		const provider = await this.providerFactory.getProvider(blockchain);
		const receipt = await provider
			.getTransactionReceipt(hash)
			.catch((err) => {
				if (err && err.reason && err.reason === "invalid hash") {
					throw new DirectToDead("Invalid tx hash given");
				}
				return undefined;
			});

		if (!receipt || isUndefined(receipt.status)) {
			throw new Error("TX receipt not available yet");
		}

		if (receipt.status === 0) {
			return;
		}

		if (!txRes) {
			txRes = await provider.getTransaction(hash);
		}

		if (!block) {
			block = await provider.getBlock(receipt.blockNumber);
		}
		const logs: TransactionLog[] = this.decodeTxLogs(receipt);
		let smartContractCall: RawTx["smartContractCall"];
		if (isSmartContractCall(txRes)) {
			const txDecoder = new TxDecoder(allAbiList);
			smartContractCall = this.decodeTxDetails(txRes, txDecoder);
		}

		return {
			hash,
			blockHeight: receipt.blockNumber,
			timestamp: new Date(block.timestamp * 1000),
			data: txRes.data,
			to: checksumed(txRes.to),
			from: checksumed(txRes.from),
			value: BN(txRes.value).toString(),
			smartContractCall,
			logs: logs
		};
	}

	private decodeTxLogs(
		txReceipt: ethers.providers.TransactionReceipt
	): TransactionLog[] {
		const decoder = new LogDecoder(allAbiList);
		const decodedLogs = decoder.decodeLogs(txReceipt.logs);
		return decodedLogs.map((log: any) => {
			const args = log.eventFragment.inputs.reduce(
				(t: any, curr: any, i: number) => {
					const argName: string = curr.name;
					t[argName] = log.args[i].toString();
					return t;
				},
				{}
			);

			return {
				tx_hash: txReceipt.transactionHash,
				name: log.name,
				signature: log.signature,
				topic: log.topic,
				address: log.address,
				args
			};
		});
	}

	private decodeTxDetails(
		txRes: ethers.providers.TransactionResponse,
		decoder: TxDecoder
	) {
		try {
			const decodedTx = decoder.decodeTx(txRes);

			const args = decodedTx.functionFragment.inputs.reduce(
				(t, curr, i) => {
					const argName: string = curr.name;
					t[argName] = decodedTx.args[i].toString();
					return t;
				},
				{} as Record<string, any>
			);

			return {
				method: decodedTx.name,
				signature: decodedTx.signature,
				args
			};
		} catch (error) {
			return {
				method: "unknown",
				signature: "external",
				args: {}
			};
		}
	}

	getMessageContextTrace({ hash, blockchain }: TxDiscoveredPayload): any {
		return {
			hash,
			blockchain
		};
	}
}
