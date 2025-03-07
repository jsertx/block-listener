import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import { Wallet, WalletIdProps } from "../../Entities/Wallet";
import { IWalletRepository } from "../../Repository/IWalletRepository";
import { WalletDiscoveredPayload } from "../../PubSub/Messages/WalletDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";
import { WalletSaved } from "../../PubSub/Messages/WalletSaved";
import { IBlockchainService } from "../../Interfaces/IBlockchainService";
import { TxDiscovered } from "../../PubSub/Messages/TxDiscovered";
import { checksumed } from "../../Utils/Address";
import { Executor } from "../../../Infrastructure/Broker/Executor";
import { WalletUpdated } from "../../PubSub/Messages/WalletUpdated";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { BlockchainId } from "../../Values/Blockchain";
import { EnsNameNotResolvedError } from "../../Errors/EnsNameNotResolvedError";
import { WalletType } from "../../Values/WalletType";

@injectable()
export class SaveWallet extends Executor<WalletDiscoveredPayload> {
	constructor(
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.BlockchainService)
		private blockchainService: IBlockchainService,
		@inject(IocKey.Broker) protected broker: IBroker,
		@inject(IocKey.Logger) protected logger: ILogger,
		@inject(IocKey.ProviderFactory)
		protected providerFactory: IProviderFactory
	) {
		super(logger, broker, Subscription.SaveWallet);
	}

	async execute({
		address,
		type = WalletType.UnknownWallet,
		alias,
		blockchain,
		tags = [],
		relations = []
	}: WalletDiscoveredPayload) {
		const resolvedAddress = await this.resolveEnsName(blockchain, address);
		const existingWhale = await this.walletRepository.findOne({
			address: resolvedAddress,
			blockchain
		});

		if (existingWhale) {
			return this.updateWallet(existingWhale, {
				alias,
				address: resolvedAddress,
				type,
				blockchain,
				tags,
				relations
			});
		}
		return this.createWallet({
			alias,
			address: resolvedAddress,
			type,
			blockchain,
			tags,
			relations
		});
	}

	private async createWallet({
		alias,
		address,
		blockchain,
		tags = [],
		relations = [],
		type
	}: WalletDiscoveredPayload) {
		const wallet = Wallet.create({
			alias,
			address,
			blockchain,
			type
		});

		tags.forEach((t) => wallet.addTag(t));
		relations.forEach((r) => wallet.addRelation(r));

		await this.findAndPublishWalletTxs({ address, blockchain });

		await this.walletRepository.save(wallet);
		await this.broker.publish(new WalletSaved({ blockchain, address }));

		this.logger.log({
			type: "save-wallet.saved",
			message: `Wallet saved: ${wallet.address}@${blockchain}`,
			context: { address: wallet.address, blockchain }
		});
	}

	async updateWallet(
		wallet: Wallet,
		{
			tags = [],
			relations = [],
			type,
			alias = undefined
		}: WalletDiscoveredPayload
	) {
		if (type) {
			// remove after some time
			wallet.setType(type);
		}
		if (alias !== undefined) {
			wallet.setAlias(alias);
		}
		relations.forEach((r) => wallet.addRelation(r));
		tags.forEach((t) => wallet.addTag(t));
		// TODO: further review, disabling as when updating
		// there is no need to  save again old txs
		// await this.findAndPublishWalletTxs({
		// 	address: wallet.address,
		// 	blockchain: wallet.blockchain.id
		// });
		await this.walletRepository.save(wallet);
		await this.broker.publish(
			new WalletUpdated({
				blockchain: wallet.blockchain.id,
				address: wallet.address
			})
		);
	}

	private async findAndPublishWalletTxs({
		address,
		blockchain
	}: WalletIdProps) {
		const txs = await this.blockchainService.getWalletTxsWithMetadata(
			blockchain,
			address
		);

		await Promise.all(
			txs.map((tx) =>
				this.broker.publish(
					new TxDiscovered({
						blockchain,
						hash: tx.hash,
						saveUnknown: true,
						saveDestinationAddress: true
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

	private async resolveEnsName(
		blockchain: BlockchainId,
		address: string
	): Promise<string> {
		if (!address.endsWith(".eth")) {
			return checksumed(address);
		}

		const provider = await this.providerFactory.getProvider(blockchain);
		const resolved = await provider.resolveName(address);
		if (!resolved) {
			throw new EnsNameNotResolvedError(blockchain, address);
		}
		return checksumed(resolved);
	}
}
