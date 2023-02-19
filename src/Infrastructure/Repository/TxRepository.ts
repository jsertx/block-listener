import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";
import { Tx, TxProps } from "../../App/Entities/Tx";
import { IConfig } from "../../Interfaces/IConfig";
import { ITxRepository } from "../../App/Repository/ITxRepository";
import { IocKey } from "../../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";
import { PartialObjectDeep } from "type-fest/source/partial-deep";
import { BlockchainId } from "../../Config/Blockchains";

@injectable()
export class TxRepository
	extends MongoBaseRepository<TxProps<any>, Tx<any>>
	implements ITxRepository
{
	constructor(
		@inject(IocKey.DbClient) client: MongoClient,
		@inject(IocKey.Config) config: IConfig
	) {
		super("tx", client, config);
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
