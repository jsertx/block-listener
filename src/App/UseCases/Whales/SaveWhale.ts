import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import { AddressRelation, Wallet } from "../../Entities/Wallet";
import { WalletType } from "../../Values/WalletType";
import { IWalletRepository } from "../../Repository/IWalletRepository";
import { WhaleDiscoveredPayload } from "../../PubSub/Messages/WhaleDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";
import { WhaleSaved } from "../../PubSub/Messages/WhaleSaved";
import { IBlockchainService } from "../../Interfaces/IBlockchainService";
import { TxDiscovered } from "../../PubSub/Messages/TxDiscovered";
import { checksumed } from "../../Utils/Address";
import { Executor } from "../../../Infrastructure/Broker/Executor";
import { WalletTag, WalletTagName } from "../../Values/WalletTag";

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
			return this.updateWhale(existingWhale, {
				address,
				blockchain,
				tags,
				relations
			});
		}
		return this.createWhale({
			address,
			blockchain,
			tags,
			relations
		});
	}

	private async createWhale({
		address,
		blockchain,
		tags = [],
		relations = []
	}: Required<WhaleDiscoveredPayload>) {
		// SaveWhale should be SaveWallet as its gonna save different wallet types
		let type = WalletType.Whale;
		if (tags.find((tag) => tag !== WalletTagName.FoundIteratingBlocks)) {
			type = WalletType.UnknownWallet;
		}
		const whale = Wallet.create({
			address,
			blockchain,
			type,
			createdAt: new Date()
		});

		tags.forEach((t) => whale.addTag(t));
		relations.forEach((r) => whale.addRelation(r));

		await this.findWhaleTxsAndPublish({ address, blockchain });
		await this.walletRepository.save(whale);
		await this.broker.publish(
			new WhaleSaved(blockchain, { blockchain, address })
		);
	}

	async updateWhale(
		wallet: Wallet,
		{ tags, relations }: Required<WhaleDiscoveredPayload>
	) {
		relations
			.filter(notExistingRelations(wallet.relations))
			.forEach((r) => wallet.addRelation(r));

		tags.filter(notExistingTags(wallet.tags)).forEach((t) =>
			wallet.addTag(t)
		);

		await this.walletRepository.save(wallet);
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
// TODO: consider moving both functions below to inside entities and allow addRelation/addTag to filter inside existing values
function notExistingRelations(relations: AddressRelation[]) {
	return (newRel: Omit<AddressRelation, "createdAt">) =>
		!relations.some(
			(rel) => rel.address === newRel.address && rel.type === newRel.type
		);
}

function notExistingTags(tags: WalletTag[]) {
	return (newTag: WalletTagName) => !tags.some((rel) => rel.tag === newTag);
}
