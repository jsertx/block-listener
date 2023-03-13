import { inject, injectable } from "inversify";
import { ITxRepository } from "../Repository/ITxRepository";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { IBroker } from "../../Interfaces/IBroker";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { RawTx, Tx } from "../Entities/Tx";
import { TxType } from "../Values/TxType";
import { isSmartContractCall } from "../Utils/Tx";

import { LogDecoder, TxDecoder } from "@maticnetwork/eth-decoder";
import { ethers } from "ethers";
import { TransactionLog } from "../Types/TransactionLog";
import { allAbiList } from "../Services/SmartContract/ABI";
import { ITxProcessor } from "../Services/TxProcessor/ITxProcessor";
import { TxDiscoveredPayload } from "../PubSub/Messages/TxDiscovered";
import { Subscription } from "../../Infrastructure/Broker/Subscription";
import { checksumed } from "../Utils/Address";
import { DirectToDead, Executor } from "../../Infrastructure/Broker/Executor";
import { isUndefined } from "../Utils/Misc";
import { BN } from "../Utils/Numbers";

import { TxProcessed } from "../PubSub/Messages/TxProcessed";

const MIN_DELAY_IN_S = 60;
const backoffStrategy = (retry: number) =>
	(Math.floor(2 ** retry) + MIN_DELAY_IN_S) * 1000;

const msgDefaults = { saveDestinationAddress: false };

@injectable()
export class ProcessTx extends Executor<TxDiscoveredPayload> {
	constructor(
		@inject(IocKey.TxRepository) private txRepository: ITxRepository,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Broker) broker: IBroker,
		@inject(IocKey.Logger) logger: ILogger,
		@inject(IocKey.TxProcessor) private txProcessor: ITxProcessor
	) {
		super(logger, broker, Subscription.DiscoveredTxToProcess, {
			backoffStrategy
		});
	}
	async execute(msg: TxDiscoveredPayload) {
		const { blockchain, hash } = {
			...msgDefaults,
			...msg
		};

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

		const unprocessedTx = Tx.create({
			blockchain,
			hash,
			data: undefined,
			raw: successfullTx,
			type: TxType.Unknown
		});
		const tx = await this.txProcessor.process(unprocessedTx);

		await this.broker.publish(
			new TxProcessed({ blockchain, tx: tx.props })
		);
	}

	/** Utils & Helper */
	private async getRawTransaction({
		blockchain,
		hash,
		txRes,
		txReceipt,
		block
	}: TxDiscoveredPayload): Promise<RawTx | undefined> {
		const provider = await this.providerFactory.getProvider(blockchain);
		let receipt = txReceipt;

		if (!receipt) {
			receipt = await provider
				.getTransactionReceipt(hash)
				.catch((err) => {
					if (err && err.reason && err.reason === "invalid hash") {
						throw new DirectToDead("Invalid tx hash given");
					}
					return undefined;
				});
		}
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
