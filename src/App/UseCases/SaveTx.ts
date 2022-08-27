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
import { WhaleDiscovered } from "../PubSub/Messages/WhaleDiscovered";
import { TokenDiscovered } from "../PubSub/Messages/TokenDiscovered";
import { IWalletRepository } from "../Repository/IWalletRepository";
import { checksumed } from "../Utils/Address";
import BigNumber from "bignumber.js";
import { IConfig } from "../../Interfaces/IConfig";
import { Executor } from "../../Infrastructure/Broker/Executor";
import { WalletTagName } from "../Values/WalletTag";
import { AddressRelationType } from "../Entities/Wallet";

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
		@inject(IocKey.TxProcessor) private txProcessor: ITxProcessor
	) {
		super(logger, broker, Subscription.SaveTx);
	}

	async execute({
		blockchain,
		hash,
		saveUnknown,
		block
	}: TxDiscoveredPayload) {
		const existingTx = await this.txRepository.findOne({
			blockchain,
			hash
		});
		if (existingTx) {
			return;
		}
		const successfullTx = await this.getRawTransaction({
			blockchain,
			hash,
			block
		});
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
		}

		if (!processedTx && !saveUnknown) {
			return;
		}

		const { saved } = await this.saveTxIfApplies(tx);
		if (!saved) {
			this.logger.debug({
				type: "save-tx.skipped",
				context: { txHash: hash, blockchain }
			});
		} else {
			this.logger.log({
				type: "save-tx.saved",
				context: { txHash: hash, blockchain }
			});
		}
	}

	private async saveTxIfApplies(tx: Tx<any>): Promise<{ saved: boolean }> {
		const walletOfTxInDb = await this.walletRepository.findOne({
			blockchain: tx.blockchain.id,
			address: tx.from
		});

		let saved = false;

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

	async saveDexSwapTxHandler(tx: DexSwapTx): Promise<boolean> {
		if (
			new BigNumber(tx.data.usdValue).lt(
				this.config.txRules[tx.blockchain.id].minDexSwapValueInUsd
			)
		) {
			return false;
		}
		await this.txRepository.save(tx);

		await Promise.all(
			[tx.data.input.token, tx.data.output.token].map((address) =>
				this.broker.publish(
					new TokenDiscovered(tx.blockchain.id, {
						blockchain: tx.blockchain.id,
						address
					})
				)
			)
		);
		const senderIsNotTarget = tx.from !== tx.data.to;

		await this.broker.publish(
			new WhaleDiscovered(tx.blockchain.id, {
				blockchain: tx.blockchain.id,
				address: tx.from,
				tags: [WalletTagName.FoundIteratingBlocks],
				relations: senderIsNotTarget
					? [
							{
								address: tx.data.to,
								type: AddressRelationType.TransferSent,
								metadata: {
									txHash: tx.hash
								}
							}
					  ]
					: []
			})
		);
		if (senderIsNotTarget) {
			await this.broker.publish(
				new WhaleDiscovered(tx.blockchain.id, {
					blockchain: tx.blockchain.id,
					address: tx.data.to,
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

		return true;
	}

	async saveEthTransferTxHandler(tx: EthTransferTx): Promise<boolean> {
		if (
			new BigNumber(tx.data.value).lt(
				this.config.txRules[tx.blockchain.id].minNativeTransferValue
			)
		) {
			return false;
		}
		await this.txRepository.save(tx);
		await Promise.all([
			this.broker.publish(
				new WhaleDiscovered(tx.blockchain.id, {
					blockchain: tx.blockchain.id,
					address: tx.data.from,
					tags: [WalletTagName.FoundIteratingBlocks],
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
				new WhaleDiscovered(tx.blockchain.id, {
					blockchain: tx.blockchain.id,
					address: tx.data.to,
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

		return true;
	}

	private async getRawTransaction({
		blockchain,
		hash,
		txRes,
		block
	}: TxDiscoveredPayload): Promise<RawTx | undefined> {
		const provider = this.providerFactory.getProvider(blockchain);
		const [res, receipt] = await Promise.all([
			txRes || provider.getTransaction(hash),
			provider.getTransactionReceipt(hash)
		]);

		if (receipt.status === 0) {
			return;
		}
		if (!res.blockNumber) {
			throw new Error("Missing block number");
		}
		if (!block) {
			block = await provider.getBlock(res.blockNumber);
		}

		const logsDecoder = new LogDecoder(allAbiList);
		const logs: TransactionLog[] = this.decodeTxLogs(receipt, logsDecoder);

		let smartContractCall: RawTx["smartContractCall"];
		if (isSmartContractCall(res)) {
			const txDecoder = new TxDecoder(allAbiList);
			smartContractCall = this.decodeTxDetails(res, txDecoder);
		}

		return {
			original: res,
			hash,
			blockHeight: receipt.blockNumber,
			timestamp: block.timestamp,
			data: res.data,
			to: checksumed(res.to),
			from: checksumed(res.from),
			value: res.value.toString(),
			smartContractCall,
			logs: logs
		};
	}

	private decodeTxLogs(
		txReceipt: ethers.providers.TransactionReceipt,
		decoder: LogDecoder
	): TransactionLog[] {
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
}
