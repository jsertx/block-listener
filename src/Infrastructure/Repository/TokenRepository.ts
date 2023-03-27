import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";

import { IConfig } from "../../Interfaces/IConfig";
import { IocKey } from "../../Ioc/IocKey";
import { PartialObjectDeep } from "type-fest/source/partial-deep";

import { Token, TokenIdProps, TokenProps } from "../../App/Entities/Token";
import {
	findTokensByBlockchainAddressParams,
	ITokenRepository
} from "../../App/Repository/ITokenRepository";
import { ICache } from "../../App/Interfaces/ICache";
import { CachedMongoBaseRepository } from "./CachedMongoBaseRepository";

@injectable()
export class TokenRepository
	extends CachedMongoBaseRepository<TokenProps, Token, TokenIdProps>
	implements ITokenRepository
{
	constructor(
		@inject(IocKey.Cache) cache: ICache,
		@inject(IocKey.DbClient) client: MongoClient,
		@inject(IocKey.Config) config: IConfig
	) {
		super("tokens", client, config, cache);
	}

	findTokensByBlockchainAddress({
		blockchain,
		addresses
	}: findTokensByBlockchainAddressParams): Promise<Token[]> {
		return this.getCollection()
			.find({
				blockchain: blockchain.id,
				address: { $in: addresses }
			})
			.toArray()
			.then(this.modelToEntityArrMapper);
	}

	protected getMatchCriteriaFromEntity(
		token: Token
	): PartialObjectDeep<TokenProps> {
		const { blockchain, address } = token.toRaw();
		return { blockchain, address };
	}

	protected modelToEntityMapper(model: WithId<TokenProps>): Token {
		return new Token(model, model._id.toString());
	}

	protected modelToEntityArrMapper(
		models: Array<WithId<TokenProps>>
	): Token[] {
		return models.map(
			(model: WithId<TokenProps>) =>
				new Token(model, model._id.toString())
		);
	}

	async findPairBaseTokensWhere(
		filters: Partial<TokenProps>
	): Promise<Token[]> {
		return this.getCollection()
			.find({
				...filters,
				useAsBaseForPairDiscovery: true
			})
			.toArray()
			.then(this.modelToEntityArrMapper);
	}
}
