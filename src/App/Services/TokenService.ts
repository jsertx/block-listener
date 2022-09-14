import { inject, injectable } from "inversify";
import { ContractCallContext } from "ethereum-multicall";
import { ethers } from "ethers";
import { ITokenService } from "../Interfaces/ITokenService";
import { IocKey } from "../../Ioc/IocKey";
import { Token } from "../Entities/Token";
import { ITokenRepository } from "../Repository/ITokenRepository";

import { Blockchain, BlockchainId } from "../Values/Blockchain";
import {
	IProviderFactory,
	multicallResultHelper
} from "../Interfaces/IProviderFactory";
import { ERC20, ERC20_32bytesSymbol } from "./SmartContract/ABI/ERC20";
import { checksumed, isSameAddress } from "../Utils/Address";
import { notUndefined } from "../Utils/Array";
import { ICache } from "../Interfaces/ICache";
import { uniqueTokenList } from "../Utils/Token";
import { noop } from "../Utils/Misc";

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
	private staticCache: Record<BlockchainId, ServiceCache> = {
		[BlockchainId.Ethereum]: createEmptyCache(),
		[BlockchainId.Binance]: createEmptyCache(),
		[BlockchainId.Polygon]: createEmptyCache()
	};

	constructor(
		@inject(IocKey.TokenRepository)
		private tokenRepository: ITokenRepository,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Cache) private cache: ICache
	) {}

	async getWrappedToken(blockchain: BlockchainId): Promise<Token> {
		const cachedValue = this.staticCache[blockchain].wrapped;
		if (cachedValue) {
			return cachedValue;
		}
		const tokens = await this.tokenRepository.findAll({
			where: { isNativeWrapped: true, blockchain }
		});

		if (tokens.data.length > 0) {
			this.staticCache[blockchain].wrapped = tokens.data[0];
			return tokens.data[0];
		}
		throw new Error(`Wrapped token not found for ${blockchain}`);
	}

	async getStableCoins(blockchain: BlockchainId): Promise<Token[]> {
		const cachedValue = this.staticCache[blockchain].stable;
		if (cachedValue.length > 0) {
			return cachedValue;
		}
		const tokens = await this.tokenRepository.findAll({
			where: { isStable: true, blockchain }
		});
		this.staticCache[blockchain].stable = tokens.data;
		return tokens.data;
	}

	async fetchTokensData(
		blockchain: BlockchainId,
		tokenAddrs: string[]
	): Promise<Token[]> {
		const tokensFromDbAndCache = await this.getTokensFromDbAndCache(
			blockchain,
			tokenAddrs
		);
		// avoid multicall call
		if (tokensFromDbAndCache.length === tokenAddrs.length) {
			return tokenAddrs
				.map((addr) =>
					tokensFromDbAndCache.find((t) =>
						isSameAddress(t.address, addr)
					)
				)
				.filter(notUndefined);
		}

		const multicall = await this.providerFactory.getMulticallProvider(
			blockchain,
			{ tryAggregate: true }
		);

		const calls: ContractCallContext<any>[] = tokenAddrs.reduce<
			ContractCallContext<any>[]
		>((calls, address) => {
			return [
				...calls,
				buildNameSymbolDecimalsErc20Call(address),
				buildBytes32NameSymbolDecimalsErc20Call(address)
			];
		}, []);

		const select = await multicall.call(calls).then(multicallResultHelper);

		const tokens = tokenAddrs.map((address) => {
			const [_name, _symbol, decimals] = select(standardKey(address), [
				"name",
				"symbol",
				"decimals"
			]);
			const [name32, symbol32] = select(bytes32Key(address), [
				"name",
				"symbol"
			]);
			const name =
				_name || (name32 && ethers.utils.parseBytes32String(name32));
			const symbol =
				_symbol ||
				(symbol32 && ethers.utils.parseBytes32String(name32));

			if (!name || !symbol || !decimals) {
				throw new Error("Invalid token data received");
			}
			return Token.create({
				address,
				blockchain,
				decimals,
				name,
				symbol,
				useAsBaseForPairDiscovery: false,
				isNativeWrapped: false,
				isStable: false
			});
		});

		await Promise.all(
			tokens.map(async (token) => {
				if (
					!tokensFromDbAndCache.some((t) =>
						isSameAddress(t.address, token.address)
					)
				) {
					return this.cache
						.set(tokenCacheKey(blockchain, token.address), token)
						.then(noop)
						.catch(noop);
				}
			})
		);
		return tokens;
	}
	async getTokensFromDbAndCache(
		blockchain: BlockchainId,
		tokenAddrs: string[]
	): Promise<Token[]> {
		const tokensFromCache = (
			await Promise.all(
				tokenAddrs.map((tokenAddr) =>
					this.cache.get<Token>(tokenCacheKey(blockchain, tokenAddr))
				)
			)
		).filter(notUndefined);

		const tokensFromDb =
			await this.tokenRepository.findTokensByBlockchainAddress({
				addresses: tokenAddrs.map(checksumed),
				blockchain: new Blockchain(blockchain)
			});
		return [...tokensFromDb, ...tokensFromCache].filter(uniqueTokenList);
	}
}

const standardKey = (address: string) => `std_${address}`;
const bytes32Key = (address: string) => `b32_${address}`;

const buildNameSymbolDecimalsErc20Call = (address: string) => ({
	abi: ERC20,
	reference: standardKey(address),
	contractAddress: address,
	calls: [
		{
			methodName: "name",
			reference: "name",
			methodParameters: []
		},
		{
			methodName: "symbol",
			reference: "symbol",
			methodParameters: []
		},
		{
			methodName: "decimals",
			reference: "decimals",
			methodParameters: []
		}
	]
});

const buildBytes32NameSymbolDecimalsErc20Call = (address: string) => ({
	abi: ERC20_32bytesSymbol,
	reference: bytes32Key(address),
	contractAddress: address,
	calls: [
		{
			methodName: "name",
			reference: "name",
			methodParameters: []
		},
		{
			methodName: "symbol",
			reference: "symbol",
			methodParameters: []
		}
	]
});

const tokenCacheKey = (blockchain: BlockchainId, addr: string) =>
	`token_service_token_${blockchain}_${addr}`;
