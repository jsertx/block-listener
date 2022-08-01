import { Multicall } from "ethereum-multicall";
import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";
import { IConfig } from "../../../Interfaces/IConfig";
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
		if (this.config.providers.alchemyJsonRpcUrl) {
			return new ethers.providers.StaticJsonRpcProvider(
				this.config.providers.alchemyJsonRpcUrl,
				blockchain.chainId
			);
		}

		return new ethers.providers.EtherscanProvider(
			blockchain.chainId,
			this.config.providers.etherScanApiKey
		);
	}
}
