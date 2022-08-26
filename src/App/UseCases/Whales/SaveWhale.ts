import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import { Wallet } from "../../Entities/Wallet";
import { WalletType } from "../../Values/WalletType";
import { IWalletRepository } from "../../Repository/IWalletRepository";
import { WhaleDiscoveredPayload } from "../../PubSub/Messages/WhaleDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";
import { WhaleSaved } from "../../PubSub/Messages/WhaleSaved";
import { IBlockchainService } from "../../Interfaces/IBlockchainService";
import { TxDiscovered } from "../../PubSub/Messages/TxDiscovered";
import { checksumed } from "../../Utils/Address";
import { Executor } from "../../../Infrastructure/Broker/Executor";

@injectable()
export class SaveWhale extends Executor<WhaleDiscoveredPayload> {
	constructor(
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.BlockchainService)
		private blockchainService: IBlockchainService,
		@inject(IocKey.Broker) protected broker: IBroker,
		@inject(IocKey.Logger) protected logger: ILogger
	) {
		super(logger, broker, Subscription.SaveWhale);
	}

	async execute({ address, blockchain }: WhaleDiscoveredPayload) {
		const existingWhale = await this.walletRepository.findOne({
			address: checksumed(address),
			blockchain
		});
		if (existingWhale) {
			return;
		}
		const whale = Wallet.create({
			address,
			blockchain,
			type: WalletType.Whale,
			createdAt: new Date(),
			relations: [],
			tags: []
		});
		await this.findWhaleTxsAndPublish({ address, blockchain });
		await this.walletRepository.save(whale);
		await this.broker.publish(
			new WhaleSaved(blockchain, { blockchain, address })
		);
	}
	private async findWhaleTxsAndPublish({
		address,
		blockchain
	}: WhaleDiscoveredPayload) {
		const txs = await this.blockchainService.getTransactionsForAddress(
			blockchain,
			address
		);
		await Promise.all(
			txs.map((hash) =>
				this.broker.publish(
					new TxDiscovered(blockchain, {
						blockchain,
						hash,
						saveUnknown: true
					})
				)
			)
		);
	}
}
