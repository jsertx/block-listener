import { Multicall } from "ethereum-multicall";
import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";
import {
	IBlockchainProviderConfig,
	IConfig
} from "../../../Interfaces/IConfig";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { IocKey } from "../../../Ioc/IocKey";
const defaultBlockchain = new Blockchain(BlockchainId.Ethereum);

@injectable()
export class ProviderFactory implements IProviderFactory {
	constructor(@inject(IocKey.Config) private config: IConfig) {}

	getMulticallProvider(
		blockchain: Blockchain | BlockchainId = defaultBlockchain
	): Multicall {
		return new Multicall({ ethersProvider: this.getProvider(blockchain) });
	}

	getProvider(blockchain: Blockchain | BlockchainId = defaultBlockchain) {
		if (!(blockchain instanceof Blockchain)) {
			blockchain = new Blockchain(blockchain);
		}
		const { url } = randomItem<IBlockchainProviderConfig>(
			this.config.providers[blockchain.id]
		);
		return new ethers.providers.StaticJsonRpcProvider(
			url,
			blockchain.chainId
		);
	}
}

function randomItem<T>(items: Array<T>) {
	return items[Math.floor(Math.random() * items.length)];
}
