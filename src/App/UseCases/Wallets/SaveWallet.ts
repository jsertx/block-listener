import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import { AddressRelation, Wallet } from "../../Entities/Wallet";
import { WalletType } from "../../Values/WalletType";
import { IWalletRepository } from "../../Repository/IWalletRepository";
import { WalletDiscoveredPayload } from "../../PubSub/Messages/WalletDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";
import { WalletSaved } from "../../PubSub/Messages/WalletSaved";
import { IBlockchainService } from "../../Interfaces/IBlockchainService";
import { TxDiscovered } from "../../PubSub/Messages/TxDiscovered";
import { checksumed } from "../../Utils/Address";
import { Executor } from "../../../Infrastructure/Broker/Executor";
import { WalletTag, WalletTagName } from "../../Values/WalletTag";
import { WalletUpdated } from "../../PubSub/Messages/WalletUpdated";

@injectable()
export class SaveWallet extends Executor<WalletDiscoveredPayload> {
	constructor(
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.BlockchainService)
		private blockchainService: IBlockchainService,
		@inject(IocKey.Broker) protected broker: IBroker,
		@inject(IocKey.Logger) protected logger: ILogger
	) {
		super(logger, broker, Subscription.SaveWallet);
	}

	async execute({
		address,
		blockchain,
		tags = [],
		relations = []
	}: WalletDiscoveredPayload) {
		const existingWhale = await this.walletRepository.findOne({
			address: checksumed(address),
			blockchain
		});
		if (existingWhale) {
			return this.updateWallet(existingWhale, {
				address,
				blockchain,
				tags,
				relations
			});
		}
		return this.createWallet({
			address,
			blockchain,
			tags,
			relations
		});
	}

	private async createWallet({
		address,
		blockchain,
		tags = [],
		relations = []
	}: Required<WalletDiscoveredPayload>) {
		const type = this.hasBeenFoundIteratingBlocks(tags)
			? WalletType.Whale
			: WalletType.UnknownWallet;

		const wallet = Wallet.create({
			address,
			blockchain,
			type,
			createdAt: new Date()
		});

		tags.forEach((t) => wallet.addTag(t));
		relations.forEach((r) => wallet.addRelation(r));
		if (type === WalletType.Whale) {
			// TODO: add test for this scenario
			await this.findWhaleTxsAndPublish({ address, blockchain });
		}
		await this.walletRepository.save(wallet);
		await this.broker.publish(new WalletSaved({ blockchain, address }));
	}

	async updateWallet(
		wallet: Wallet,
		{ tags, relations }: Required<WalletDiscoveredPayload>
	) {
		relations
			.filter(notExistingRelations(wallet.relations))
			.forEach((r) => wallet.addRelation(r));

		tags.filter(notExistingTags(wallet.tags)).forEach((t) =>
			wallet.addTag(t)
		);

		if (this.hasBeenFoundIteratingBlocks(tags)) {
			// TODO: review if this is correct as it could be a transfer to an exchange main wallet
			// wallet.setType(WalletType.Whale);
		}

		await this.walletRepository.save(wallet);
		await this.broker.publish(
			new WalletUpdated({
				blockchain: wallet.blockchain.id,
				address: wallet.address
			})
		);
	}

	private async findWhaleTxsAndPublish({
		address,
		blockchain
	}: WalletDiscoveredPayload) {
		const txs = await this.blockchainService.getWalletTxsHashes(
			blockchain,
			address
		);
		await Promise.all(
			txs.map((hash) =>
				this.broker.publish(
					new TxDiscovered({
						blockchain,
						hash,
						saveUnknown: true
					})
				)
			)
		);
	}

	private hasBeenFoundIteratingBlocks(tags: WalletTagName[]) {
		return tags.find((tag) => tag === WalletTagName.FoundIteratingBlocks);
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
