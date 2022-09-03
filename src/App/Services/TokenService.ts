import { inject, injectable } from "inversify";
import { ITokenService } from "../Interfaces/ITokenService";
import { IocKey } from "../../Ioc/IocKey";
import { Token } from "../Entities/Token";
import { ITokenRepository } from "../Repository/ITokenRepository";

import { BlockchainId } from "../Values/Blockchain";
import { ethers } from "ethers";
import {
	IProviderFactory,
	multicallResultHelper
} from "../Interfaces/IProviderFactory";
import { ERC20, ERC20_32bytesSymbol } from "./SmartContract/ABI/ERC20";
import { ContractCallContext } from "ethereum-multicall";

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
		private tokenRepository: ITokenRepository,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory
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

	async fetchTokensData(
		blockchain: BlockchainId,
		tokenAddrs: string[]
	): Promise<Token[]> {
		const multicall = this.providerFactory.getMulticallProvider(
			blockchain,
			{ tryAggregate: true }
		);
		let calls: ContractCallContext<any>[] = [];
		const standardKey = (address: string) => `std_${address}`;
		const bytes32Key = (address: string) => `b32_${address}`;
		tokenAddrs.forEach(
			(address) =>
				(calls = [
					...calls,

					{
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
					},
					{
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
					}
				])
		);
		const select = await multicall.call(calls).then(multicallResultHelper);
		return tokenAddrs.map((address) => {
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
	}
}
