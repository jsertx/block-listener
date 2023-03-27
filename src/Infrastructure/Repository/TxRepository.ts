import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";
import { Tx, TxIdProps, TxProps } from "../../App/Entities/Tx";
import { IConfig } from "../../Interfaces/IConfig";
import { ITxRepository } from "../../App/Repository/ITxRepository";
import { IocKey } from "../../Ioc/IocKey";
import { PartialObjectDeep } from "type-fest/source/partial-deep";
import { BlockchainId } from "../../Config/Blockchains";
import { CachedMongoBaseRepository } from "./CachedMongoBaseRepository";
import { ICache } from "../../App/Interfaces/ICache";

@injectable()
export class TxRepository
	extends CachedMongoBaseRepository<TxProps<any>, Tx<any>, TxIdProps>
	implements ITxRepository
{
	constructor(
		@inject(IocKey.Cache) cache: ICache,
		@inject(IocKey.DbClient) client: MongoClient,
		@inject(IocKey.Config) config: IConfig
	) {
		super("tx", client, config, cache);
	}

	async getAllTokensFoundInSwaps(blockchain: BlockchainId): Promise<{
		blockchain: BlockchainId;
		addresses: string[];
	}> {
		const docs = await this.getCollection()
			.aggregate([
				{
					$match: {
						type: "dex_swap",
						blockchain
					}
				},
				{
					$addFields: {
						tokens: ["$data.input.token", "$data.output.token"]
					}
				},
				{
					$unset: ["_id", "hash", "data", "raw", "type"]
				},
				{
					$unwind: {
						path: "$tokens",
						preserveNullAndEmptyArrays: false
					}
				},
				{
					$group: {
						_id: "$blockchain",
						addresses: {
							$addToSet: "$tokens"
						}
					}
				}
			])
			.toArray();

		return docs.map((doc) => ({
			blockchain: doc.blockchain,
			addresses: doc.addresses
		}))[0];
	}

	protected getMatchCriteriaFromEntity(
		tx: Tx<any>
	): PartialObjectDeep<TxProps<any>> {
		const { hash, blockchain } = tx.toRaw();
		return { blockchain, hash };
	}

	protected modelToEntityMapper(model: WithId<TxProps<any>>): Tx<any> {
		return new Tx(model, model._id.toString());
	}
}
