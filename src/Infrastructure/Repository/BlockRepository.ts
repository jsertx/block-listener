import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";

import { IConfig } from "../../Interfaces/IConfig";
import { IocKey } from "../../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";

import { Block, BlockProps } from "../../App/Entities/Block";
import { IBlockRepository } from "../../App/Repository/IBlockRepository";
import { BlockchainId } from "../../Config/Blockchains";
import { PartialObjectDeep } from "type-fest/source/partial-deep";

@injectable()
export class BlockRepository
	extends MongoBaseRepository<BlockProps, Block>
	implements IBlockRepository
{
	protected getMatchCriteriaFromEntity(
		block: Block
	): PartialObjectDeep<BlockProps> {
		const { blockchain, height } = block.toRaw();
		return { blockchain, height };
	}

	protected modelToEntityMapper(model: WithId<BlockProps>): Block {
		return new Block(model, model._id.toString());
	}
	constructor(
		@inject(IocKey.DbClient) client: MongoClient,
		@inject(IocKey.Config) config: IConfig
	) {
		super("blocks", client, config);
	}

	findLatestBlock(blockchain: BlockchainId): Promise<Block | undefined> {
		return this.getCollection()
			.find({
				blockchain
			})
			.sort({ height: -1 })
			.limit(1)
			.toArray()
			.then((res) => {
				if (res.length === 1) {
					return this.modelToEntityMapper(res[0]);
				}
			});
	}
}
