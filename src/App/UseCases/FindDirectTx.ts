import { inject, injectable } from "inversify";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { ILogger } from "../../Interfaces/ILogger";
import { IConfig } from "../../Interfaces/IConfig";
import { isSameAddress } from "../Utils/Address";
import { isNativeTokenTx } from "../Utils/Tx";
import { IocKey } from "../../Ioc/IocKey";
import { toPrecision } from "../Utils/Amount";
import { IContractRepository } from "../Repository/IContractRepository";
import { IAppBroker } from "../Interfaces/IAppBroker";
import { TxDiscovered } from "../PubSub/Messages/TxDiscovered";
import { BlockReceivedPayload } from "../PubSub/Messages/BlockReceived";
import { Subscription } from "../../Infrastructure/Broker/Subscription";
import { IWalletRepository } from "../Repository/IWalletRepository";
import { Wallet } from "../Entities/Wallet";
import { Contract } from "../Entities/Contract";
import { BlockchainId } from "../Values/Blockchain";
import { Executor } from "../../Infrastructure/Broker/Executor";

@injectable()
export class FindDirectTx extends Executor<BlockReceivedPayload> {
	constructor(
		@inject(IocKey.Logger) logger: ILogger,
		@inject(IocKey.Config) private config: IConfig,
		@inject(IocKey.Broker) broker: IAppBroker,
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository,
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository
	) {
		super(logger, broker, Subscription.FindDirectTx, {});
	}

	async execute({ block, blockchain }: BlockReceivedPayload): Promise<void> {
		const [contracts, wallets] = await Promise.all([
			this.contractRepository.findAll({
				where: { blockchain }
			}),
			this.walletRepository.findAll({ where: { blockchain } })
		]);

		for (const tx of block.transactions) {
			if (
				this.isBigNativeTx(blockchain, tx) ||
				this.isAgainstContractOfInterest(tx, contracts.data) ||
				this.isDoneByTrackedWallet(tx, wallets.data)
			) {
				this.broker.publish(
					new TxDiscovered(blockchain, {
						blockchain,
						hash: tx.hash,
						txRes: tx
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

	private isDoneByTrackedWallet(
		txRes: ethers.providers.TransactionResponse,
		wallets: Wallet[]
	): boolean {
		return wallets.some((wallet) =>
			isSameAddress(wallet.address, txRes.from)
		);
	}

	private isAgainstContractOfInterest(
		txRes: ethers.providers.TransactionResponse,
		addressesOfInterest: Contract[]
	): boolean {
		return addressesOfInterest.some((contract) =>
			isSameAddress(contract.address, txRes.to)
		);
	}
}
