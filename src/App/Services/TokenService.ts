import { inject, injectable } from "inversify";
import { ContractCallContext } from "ethereum-multicall";
import { ethers } from "ethers";
import { ITokenService, TokenWithPriceData } from "../Interfaces/ITokenService";
import { IocKey } from "../../Ioc/IocKey";
import { Token, TokenProps } from "../Entities/Token";
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
import { IContractRepository } from "../Repository/IContractRepository";
import { UniswapFactory } from "./SmartContract/ABI/Uniswap/V2/UniswapFactory";
import { UniswapPair } from "./SmartContract/ABI/Uniswap/V2/UniswapPair";
import { BN } from "../Utils/Numbers";

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
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository,
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

			if (!name || !symbol || typeof decimals !== "number") {
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
						.set(
							tokenCacheKey(blockchain, token.address),
							token.props
						)
						.then(noop)
						.catch(noop);
				}
			})
		);
		return tokens;
	}
	async fetchTokenDataWithPrice(
		blockchain: BlockchainId,
		tokenAddr: string
	): Promise<TokenWithPriceData> {
		const [factory] = await this.contractRepository.findContractsBy({
			blockchain,
			alias: "uniswap.v2.factory"
		});
		if (!factory) {
			throw new Error("Uniswap Factory not found");
		}
		const provider = await this.providerFactory.getProvider(blockchain);
		const wrapped = await this.getWrappedToken(blockchain);
		const [token] = await this.fetchTokensData(blockchain, [tokenAddr]);
		const factoryContract = new ethers.Contract(
			factory.address,
			UniswapFactory,
			provider
		);
		const pairAddress = await factoryContract.getPair(
			token.address,
			wrapped.address
		);
		const multicall = await this.providerFactory.getMulticallProvider(
			blockchain,
			{ tryAggregate: true }
		);

		const calls: ContractCallContext<any>[] = [
			{
				reference: pairAddress,
				abi: UniswapPair,
				contractAddress: pairAddress,
				calls: [
					{
						methodName: "getReserves",
						reference: "getReserves",
						methodParameters: []
					},
					...["token0", "token1"].map((methodName) => ({
						methodName,
						reference: methodName,
						methodParameters: []
					}))
				]
			}
		];

		const select = await multicall.call(calls).then(multicallResultHelper);
		const [reserves, token0] = select(pairAddress, [
			"getReserves",
			"token0"
		]);
		const reserves0 = BN(reserves[0]);
		const reserves1 = BN(reserves[1]);
		const token0IsWeth = isSameAddress(token0, wrapped.address);
		const wethReserves = wrapped.toFormatted(
			token0IsWeth ? reserves0.toString() : reserves1.toString()
		);
		const tokenReserves = wrapped.toFormatted(
			token0IsWeth ? reserves1.toString() : reserves0.toString()
		);

		const nativePrice = BN(wethReserves).dividedBy(tokenReserves);
		return { token, nativePrice: nativePrice.toString() };
	}
	async getTokensFromDbAndCache(
		blockchain: BlockchainId,
		tokenAddrs: string[]
	): Promise<Token[]> {
		const tokensFromCache = (
			await Promise.all(
				tokenAddrs.map((tokenAddr) =>
					this.cache.get<TokenProps>(
						tokenCacheKey(blockchain, tokenAddr)
					)
				)
			)
		)
			.filter(notUndefined)
			.map((props) => Token.create(props));

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
