import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import {
	AddressRelationType,
	Wallet,
	WalletIdProps
} from "../../Entities/Wallet";
import { WalletType } from "../../Values/WalletType";
import { IWalletRepository } from "../../Repository/IWalletRepository";
import { WalletDiscoveredPayload } from "../../PubSub/Messages/WalletDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";
import { WalletSaved } from "../../PubSub/Messages/WalletSaved";
import { IBlockchainService } from "../../Interfaces/IBlockchainService";
import { TxDiscovered } from "../../PubSub/Messages/TxDiscovered";
import { checksumed } from "../../Utils/Address";
import { Executor } from "../../../Infrastructure/Broker/Executor";
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
		type,
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
				type,
				blockchain,
				tags,
				relations
			});
		}
		return this.createWallet({
			address,
			type,
			blockchain,
			tags,
			relations
		});
	}

	private async createWallet({
		address,
		blockchain,
		tags = [],
		relations = [],
		type
	}: WalletDiscoveredPayload) {
		if (!type) {
			// todo: change when all wallets in queue ends
			type = relations.some(
				(rel) => rel.type === AddressRelationType.TransferSent
			)
				? WalletType.Whale
				: WalletType.UnknownWallet;
		}
		const wallet = Wallet.create({
			address,
			blockchain,
			type
		});

		tags.forEach((t) => wallet.addTag(t));
		relations.forEach((r) => wallet.addRelation(r));

		if (type === WalletType.Whale) {
			await this.findWhaleTxsAndPublish({ address, blockchain });
		}

		await this.walletRepository.save(wallet);
		await this.broker.publish(new WalletSaved({ blockchain, address }));

		this.logger.log({
			type: "save-wallet.saved",
			message: `Wallet saved: ${wallet}@${blockchain}`,
			context: { address: wallet.address, blockchain }
		});
	}

	async updateWallet(
		wallet: Wallet,
		{ tags, relations, type }: Required<WalletDiscoveredPayload>
	) {
		if (type) {
			// remove after some time
			wallet.setType(type);
		}
		relations.forEach((r) => wallet.addRelation(r));
		tags.forEach((t) => wallet.addTag(t));

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
	}: WalletIdProps) {
		const txs = await this.blockchainService
			.getWalletTxsHashes(blockchain, address)
			.catch((error) => {
				throw error;
			});
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

	getMessageContextTrace({
		address,
		blockchain
	}: WalletDiscoveredPayload): any {
		return {
			address,
			blockchain
		};
	}
}
