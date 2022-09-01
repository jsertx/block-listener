import { Multicall } from "ethereum-multicall";
import { inject, injectable } from "inversify";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";
import { IConfig } from "../../../Interfaces/IConfig";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
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

	getMulticallProvider(blockchain: Blockchain | BlockchainId): Multicall {
		return new Multicall({ ethersProvider: this.getProvider(blockchain) });
	}

	getProvider(blockchain: Blockchain | BlockchainId) {
		if (!(blockchain instanceof Blockchain)) {
			blockchain = new Blockchain(blockchain);
		}
		const availableProvider = this.nodes[blockchain.id].find((node) =>
			node.bottleneck.check()
		);
		if (availableProvider) {
			return availableProvider.provider;
		}

		const { provider } = randomItem<ILimittedProvider>(
			this.nodes[blockchain.id]
		);

		return provider;
	}
}

function randomItem<T>(items: Array<T>) {
	return items[Math.floor(Math.random() * items.length)];
}
