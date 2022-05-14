import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { Blockchain } from "../../Domain/Values/Blockchain";
import { IConfig } from "../../Interfaces/IConfig";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { IocKey } from "../../Ioc/IocKey";

const blockchainToChainId: Record<Blockchain, number> = {
  [Blockchain.Ethereum]: 1,
};

@injectable()
export class ProviderFactory implements IProviderFactory {
  constructor(@inject(IocKey.Config) private config: IConfig) {}

  getProvider(blockchain: Blockchain = Blockchain.Ethereum) {
    const chainId = blockchainToChainId[blockchain];
    return new ethers.providers.EtherscanProvider(
      chainId,
      this.config.providers.etherScanApiKey
    );
  }
}
