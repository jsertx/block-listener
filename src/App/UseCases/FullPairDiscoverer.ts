import { inject, injectable } from "inversify";
import { IocKey } from "../../Ioc/IocKey";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { IContractRepository } from "../Repository/IContractRepository";
import { ethers } from "ethers";
import { ABI } from "../Services/SmartContract/ABI";
import cron from "node-cron";
import { CronSchedule } from "../Types/CronSchedule";
import { ContractType } from "../Values/ContractType";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { Contract, FactoryData, PairData } from "../Entities/Contract";
import { toHex } from "../Utils/Numbers";
import { Dex } from "../Values/Dex";
import { ILogger } from "../../Interfaces/ILogger";

type FactoryByChainMap = Partial<Record<BlockchainId, Contract[]>>;
type PairByChainAndFactoryMap = Partial<
	Record<BlockchainId, Record<string, string[]>>
>;

@injectable()
export class FullPairDiscoverer implements IStandaloneApps {
	constructor(
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository,
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
					message: "FullPair Discovered executed",
					type: "full-pair-discoverer.execute"
				});
			} catch (error) {
				this.logger.error({
					message: "FullPair Discovered execution failed",
					type: "full-pair-discoverer.execute",
					error
				});
			}
		});
	}

	async execute() {
		const factoriesByChain = await this.getFactoriesByBlockchain();

		const pairsByChainAndFactory: PairByChainAndFactoryMap = {};

		for (const [_blockchain, factories] of Object.entries(
			factoriesByChain
		)) {
			const blockchain = _blockchain as BlockchainId;
			pairsByChainAndFactory[blockchain] = await this.fetchMissingPairs(
				blockchain,
				factories
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
					pairs.map((address) =>
						this.buildPairContracts(address, blockchain, dex)
					)
				);
				await this.contractRepository.saveMany(contracts);
			}
		}
	}

	async buildPairContracts(
		address: string,
		blockchain: BlockchainId,
		dex: Dex
	): Promise<Contract> {
		const provider = await this.providerFactory.getProvider(
			new Blockchain(blockchain)
		);
		const pairContract = new ethers.Contract(
			address,
			ABI.UniswapPair,
			provider
		);
		const [tokenA, tokenB] = await Promise.all([
			pairContract.token0(),
			pairContract.token1()
		]);

		const tokenAContract = new ethers.Contract(tokenA, ABI.ERC20, provider);
		const tokenBContract = new ethers.Contract(tokenB, ABI.ERC20, provider);

		const [symbolA, symbolB] = await Promise.all([
			tokenAContract.symbol(),
			tokenBContract.symbol()
		]);

		const data: PairData = { dex, tokenA, tokenB };
		return Contract.create({
			address,
			type: ContractType.UniswapPairV2Like,
			alias: `${dex}:${symbolA}/${symbolB}`,
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
		factories: Contract<FactoryData>[]
	): Promise<Record<string, string[]>> {
		const provider = await this.providerFactory.getProvider(
			new Blockchain(blockchain)
		);
		const addressesByFactory: Record<string, string[]> = {};
		for (const factory of factories) {
			const dex = factory.data.dex;
			const factoryPairsCount =
				await this.contractRepository.countDexPairs({
					dex,
					blockchain
				});
			const factoryContract = new ethers.Contract(
				factory.address,
				factory.abi,
				provider
			);
			const allPairsLength = await factoryContract
				.allPairsLength()
				.then((res: any) => res.toNumber());
			if (allPairsLength <= factoryPairsCount) {
				continue;
			}
			const factoryAddresses: string[] = [];
			for (let i = factoryPairsCount; i < allPairsLength; i++) {
				const newPairAddress = await factoryContract.allPairs(toHex(i));
				factoryAddresses.push(newPairAddress);
			}
			addressesByFactory[dex] = factoryAddresses;
		}
		return addressesByFactory;
	}
}
