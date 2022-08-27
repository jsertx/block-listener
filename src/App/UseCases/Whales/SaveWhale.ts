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
import { WalletTagName } from "../../Values/WalletTag";

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

	async execute({
		address,
		blockchain,
		tags = [],
		relations = []
	}: WhaleDiscoveredPayload) {
		const existingWhale = await this.walletRepository.findOne({
			address: checksumed(address),
			blockchain
		});
		if (existingWhale) {
			return;
		}
		let type = WalletType.Whale;
		if (tags.find((tag) => tag !== WalletTagName.FoundDoingTx)) {
			type = WalletType.UnknownWallet;
		}
		const whale = Wallet.create({
			address,
			blockchain,
			// SaveWhale should be SaveWallet as its gonna save different wallet types
			type,
			createdAt: new Date(),
			tags: tags.map((tag) => ({ tag, createdAt: new Date() })),
			relations: relations.map((rel) => ({
				type: rel.type,
				metadata: rel.metadata,
				address: rel.address,
				createdAt: new Date()
			}))
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
