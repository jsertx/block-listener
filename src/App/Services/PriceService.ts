import axios from "axios";
import BigNumber from "bignumber.js";
import { BigNumberish } from "ethers";
import { injectable } from "inversify";

import { IPriceService } from "../Interfaces/IPriceService";
import { Blockchain } from "../Values/Blockchain";

@injectable()
export class PriceService implements IPriceService {
  async getBlockchainNativeTokenUsdPrice(
    blockchain: Blockchain
  ): Promise<BigNumber> {
    const res: any = await axios
      .get(
        `https://min-api.cryptocompare.com/data/price?fsym=${blockchain.nativeTokenSymbol}&tsyms=USD`
      )
      .then((res) => res.data);

    return new BigNumber(res.USD);
  }

  async getBlockchainNativeTokenUsdValue(
    blockchain: Blockchain,
    amount: BigNumber | string
  ): Promise<BigNumber> {
    const price = await this.getBlockchainNativeTokenUsdPrice(blockchain);
    return price.multipliedBy(amount);
  }
}
