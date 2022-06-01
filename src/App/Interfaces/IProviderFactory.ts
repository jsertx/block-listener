import { ethers } from "ethers";
import { Blockchain } from "../../Domain/Values/Blockchain";

export interface IProviderFactory {
  getProvider(blockchain?: Blockchain): ethers.providers.BaseProvider;
}
