import BigNumber from "bignumber.js";
import { Blockchain } from "../Values/Blockchain";

export interface IPriceService {
  getBlockchainNativeTokenUsdPrice(blockchain: Blockchain): Promise<BigNumber>;
  getBlockchainNativeTokenUsdValue(
    blockchain: Blockchain,
    amount: BigNumber | string
  ): Promise<BigNumber>;
}
