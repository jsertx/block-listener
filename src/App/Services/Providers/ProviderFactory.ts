import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { Blockchain, BlockchainId } from "../../../Domain/Values/Blockchain";
import { IConfig } from "../../../Interfaces/IConfig";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { IocKey } from "../../../Ioc/IocKey";

const defaultBlockchain = new Blockchain(BlockchainId.Ethereum);

@injectable()
export class ProviderFactory implements IProviderFactory {
  constructor(@inject(IocKey.Config) private config: IConfig) {}

  getProvider(blockchain: Blockchain = defaultBlockchain) {
    return new ethers.providers.EtherscanProvider(
      blockchain.chainId,
      this.config.providers.etherScanApiKey
    );
  }
}
