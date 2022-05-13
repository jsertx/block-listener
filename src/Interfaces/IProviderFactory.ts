import { ethers } from "ethers";
import { Blockchain } from "../Enums/Blockchain";

export interface IProviderFactory {
  getProvider(blockchain?: Blockchain): ethers.providers.BaseProvider;
}
