import { inject, injectable } from "inversify";
import { IocKey } from "../../../Ioc/IocKey";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { IStandaloneApps } from "../../Interfaces/IStandaloneApps";
import { IContractRepository } from "../../Repository/IContractRepository";
import { ethers } from "ethers";
import cron from "node-cron";
import { CronSchedule } from "../../Types/CronSchedule";
import { ContractType } from "../../Values/ContractType";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";
import { Contract, FactoryData, PairData } from "../../Entities/Contract";
import { Dex } from "../../Values/Dex";
import { ITokenRepository } from "../../Repository/ITokenRepository";
import { Token } from "../../Entities/Token";
import { ZERO_ADDRESS } from "../../Utils/Address";
import { ILogger } from "../../../Interfaces/ILogger";

type PairAndTokens = {
	address: string;
	tokenA: Token;
	tokenBase: Token;
};
type FactoryByChainMap = Partial<Record<BlockchainId, Contract[]>>;
type PairByChainAndFactoryMap = Partial<
	Record<BlockchainId, Record<string, PairAndTokens[]>>
>;

@injectable()
export class SelectivePairDiscoverer implements IStandaloneApps {
	constructor(
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository,
		@inject(IocKey.TokenRepository)
		private tokenRepository: ITokenRepository,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Logger)
		private logger: ILogger
	) {}

	async start() {
		cron.schedule(CronSchedule.EveryHour, async () => {
			try {
				await this.execute();
				this.logger.log({
					message: "SelectivePair Discovered executed",
					type: "selective-pair-discoverer.execute"
				});
			} catch (error) {
				this.logger.error({
					message: "SelectivePair Discovered execution failed",
					type: "selective-pair-discoverer.execute",
					error
				});
			}
		});
	}

	async execute() {
		const factoriesByChain = await this.getFactoriesByBlockchain();
		const tokens = await this.tokenRepository
			.findAll()
			.then((res) => res.data);
		const pairsByChainAndFactory: PairByChainAndFactoryMap = {};

		for (const [_blockchain, factories] of Object.entries(
			factoriesByChain
		)) {
			const blockchain = _blockchain as BlockchainId;
			pairsByChainAndFactory[blockchain] = await this.fetchMissingPairs(
				blockchain,
				factories,
				tokens
			);
		}

		await this.savePairContracts(pairsByChainAndFactory);
	}

	async savePairContracts(
		pairsByChainAndFactory: PairByChainAndFactoryMap
	): Promise<void> {
		for (const [_blockchain, pairsByFactory] of Object.entries(
			pairsByChainAndFactory
		)) {
			const blockchain = _blockchain as BlockchainId;
			for (const [factory, pairs] of Object.entries(pairsByFactory)) {
				const dex = factory as Dex;
				const contracts = await Promise.all(
					pairs.map((pairData) =>
						this.buildPairContracts(pairData, blockchain, dex)
					)
				);
				await this.contractRepository.saveMany(contracts);
			}
		}
	}

	async buildPairContracts(
		{ address, tokenA, tokenBase }: PairAndTokens,
		blockchain: BlockchainId,
		dex: Dex
	): Promise<Contract> {
		const data: PairData = {
			dex,
			tokenA: tokenA.address,
			tokenB: tokenBase.address
		};
		return Contract.create({
			address,
			type: ContractType.UniswapPairV2Like,
			alias: `${dex}:${tokenA.symbol}-${tokenBase.symbol}`,
			blockchain,
			createdAt: new Date(),
			data
		});
	}

	async getFactoriesByBlockchain(): Promise<FactoryByChainMap> {
		const factories = await this.contractRepository.findContractsBy({
			type: ContractType.UniswapFactoryV2Like
		});

		return factories.reduce((map, factory) => {
			const others = map[factory.blockchain.id] || [];
			return {
				...map,
				[factory.blockchain.id]: [...others, factory]
			};
		}, {} as FactoryByChainMap);
	}

	private async fetchMissingPairs(
		blockchain: BlockchainId,
		factories: Contract<FactoryData>[],
		tokens: Token[]
	): Promise<Record<string, PairAndTokens[]>> {
		const pairs = await this.contractRepository.findContractsBy({
			type: ContractType.UniswapPairV2Like,
			blockchain
		});
		const { baseTokens, otherTokens } = tokens.reduce(
			(map, token) => {
				if (token.blockchain.equals(blockchain)) {
					if (token.useAsBaseForPairDiscovery) {
						map.baseTokens.push(token);
					} else {
						map.otherTokens.push(token);
					}
				}

				return map;
			},
			{ baseTokens: [] as Token[], otherTokens: [] as Token[] }
		);

		const provider = await this.providerFactory.getProvider(
			new Blockchain(blockchain)
		);
		const addressesByFactory: Record<string, PairAndTokens[]> = {};
		for (const factory of factories) {
			const dex = factory.data.dex;
			const factoryContract = new ethers.Contract(
				factory.address,
				factory.abi,
				provider
			);
			addressesByFactory[dex] = [];
			for (const baseToken of baseTokens) {
				for (const otherToken of otherTokens) {
					const pairAddress: string = await factoryContract.getPair(
						baseToken.address,
						otherToken.address
					);
					if (skipPair(pairAddress, pairs)) {
						continue;
					}
					addressesByFactory[dex].push({
						address: pairAddress,
						tokenA: otherToken,
						tokenBase: baseToken
					});
				}
			}
		}
		return addressesByFactory;
	}
}

function skipPair(pairAddress: string, pairs: Contract[]) {
	// not exists
	if (pairAddress === ZERO_ADDRESS) {
		return true;
	}

	return pairs.find(
		(pair) => pair.address.toLowerCase() === pairAddress.toLowerCase()
	);
}
