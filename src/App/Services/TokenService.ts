import { inject, injectable } from "inversify";
import { ITokenService } from "../Interfaces/ITokenService";
import { IocKey } from "../../Ioc/IocKey";
import { Token } from "../Entities/Token";
import { ITokenRepository } from "../Repository/ITokenRepository";

import { BlockchainId } from "../Values/Blockchain";

interface ServiceCache {
	stable: Token[];
	wrapped: Token | undefined;
}
const createEmptyCache = (): ServiceCache => ({
	stable: [],
	wrapped: undefined
});

@injectable()
export class TokenService implements ITokenService {
	private cache: Record<BlockchainId, ServiceCache> = {
		[BlockchainId.Ethereum]: createEmptyCache(),
		[BlockchainId.Binance]: createEmptyCache(),
		[BlockchainId.Polygon]: createEmptyCache()
	};

	constructor(
		@inject(IocKey.TokenRepository)
		private tokenRepository: ITokenRepository
	) {}

	async getWrappedToken(blockchain: BlockchainId): Promise<Token> {
		const cachedValue = this.cache[blockchain].wrapped;
		if (cachedValue) {
			return cachedValue;
		}
		const tokens = await this.tokenRepository.findAll({
			where: { isNativeWrapped: true, blockchain }
		});

		if (tokens.data.length > 0) {
			this.cache[blockchain].wrapped = tokens.data[0];
			return tokens.data[0];
		}
		throw new Error(`Wrapped token not found for ${blockchain}`);
	}

	async getStableCoins(blockchain: BlockchainId): Promise<Token[]> {
		const cachedValue = this.cache[blockchain].stable;
		if (cachedValue.length > 0) {
			return cachedValue;
		}
		const tokens = await this.tokenRepository.findAll({
			where: { isStable: true, blockchain }
		});
		this.cache[blockchain].stable = tokens.data;
		return tokens.data;
	}
}
