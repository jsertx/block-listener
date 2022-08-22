import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";
import { IConfig } from "../../Interfaces/IConfig";
import { IocKey } from "../../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";
import { PartialObjectDeep } from "type-fest/source/partial-deep";
import { BlockchainId } from "../../App/Values/Blockchain";
import { Wallet, WalletRaw } from "../../App/Entities/Wallet";
import { IWalletRepository } from "../../App/Repository/IWalletRepository";
import { checksumed } from "../../App/Utils/Address";

@injectable()
export class WalletRepository
	extends MongoBaseRepository<WalletRaw, Wallet>
	implements IWalletRepository
{
	constructor(
		@inject(IocKey.DbClient) client: MongoClient,
		@inject(IocKey.Config) config: IConfig
	) {
		super("wallets", client, config);
	}

	protected getMatchCriteriaFromEntity(
		address: Wallet
	): PartialObjectDeep<WalletRaw> {
		const { blockchain } = address.toRaw();
		return { blockchain, address: address.address };
	}

	protected modelToEntityMapper(model: WithId<WalletRaw>): Wallet {
		return new Wallet(model, model._id.toString());
	}

	findWallet(
		address: string,
		blockchain: BlockchainId
	): Promise<Wallet | null> {
		return this.getCollection()
			.findOne({
				address: checksumed(address),
				blockchain
			})
			.then((res) => {
				if (!res) {
					return null;
				}
				return this.modelToEntityMapper(res);
			});
	}
}
