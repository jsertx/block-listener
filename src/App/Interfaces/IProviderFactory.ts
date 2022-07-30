import { ethers } from "ethers";
import { Blockchain, BlockchainId } from "../Values/Blockchain";

export interface IProviderFactory {
  getProvider(
    blockchain?: Blockchain | BlockchainId
  ): ethers.providers.BaseProvider;
}
