import { Multicall } from "ethereum-multicall";
import { inject, injectable } from "inversify";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";
import { IConfig } from "../../../Interfaces/IConfig";
import {
	IProviderFactory,
	MulticallOptions
} from "../../Interfaces/IProviderFactory";
import { IocKey } from "../../../Ioc/IocKey";
import { createWrappedProvider } from "./Utils";
import { ILogger } from "../../../Interfaces/ILogger";
import Bottleneck from "bottleneck";
import { ethers } from "ethers";

interface ILimittedProvider {
	bottleneck: Bottleneck;
	provider: ethers.providers.JsonRpcProvider;
}
@injectable()
export class ProviderFactory implements IProviderFactory {
	private nodes: Record<BlockchainId, Array<ILimittedProvider>> = {
		[BlockchainId.Ethereum]: [],
		[BlockchainId.Polygon]: [],
		[BlockchainId.Binance]: []
	};
	constructor(
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.Config) private config: IConfig
	) {
		this.buildWrappedNodes();
	}

	private buildWrappedNodes() {
		Object.values(BlockchainId).forEach((blockchainId) => {
			const blockchain = new Blockchain(blockchainId);
			this.config.providers[blockchain.id].forEach(
				({ url, rateConfig }) => {
					const { bottleneck, provider } = createWrappedProvider(
						this.logger,
						url,
						blockchain.chainId,
						rateConfig
					);
					this.nodes[blockchain.id].push({ bottleneck, provider });
				}
			);
		});
	}

	async getMulticallProvider(
		blockchain: Blockchain | BlockchainId,
		{ tryAggregate }: MulticallOptions = { tryAggregate: false }
	): Promise<Multicall> {
		const ethersProvider = await this.getProvider(blockchain);
		return new Multicall({
			ethersProvider,
			tryAggregate
		});
	}

	async getProvider(
		blockchain: Blockchain | BlockchainId
	): Promise<ethers.providers.JsonRpcProvider> {
		if (!(blockchain instanceof Blockchain)) {
			blockchain = new Blockchain(blockchain);
		}
		const randomProvider = randomItem<ILimittedProvider>(
			this.nodes[blockchain.id]
		);
		return randomProvider.provider;
		// disable bottlenecking atm
		// if (await randomProvider.bottleneck.check()) {
		// 	return randomProvider.provider;
		// }

		// const providerStatuses = await Promise.all(
		// 	this.nodes[blockchain.id].map(async (n) => {
		// 		return {
		// 			provider: n.provider,
		// 			available: await n.bottleneck.check()
		// 		};
		// 	})
		// );
		// const firstAvailableProvider = providerStatuses.find(
		// 	(p) => p.available
		// );

		// if (firstAvailableProvider) {
		// 	return firstAvailableProvider.provider;
		// }

		// return randomProvider.provider;
	}
}

function randomItem<T>(items: Array<T>) {
	return items[Math.floor(Math.random() * items.length)];
}
