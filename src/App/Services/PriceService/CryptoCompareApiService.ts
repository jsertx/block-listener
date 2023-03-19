import axios from "axios";
import BigNumber from "bignumber.js";
import { injectable } from "inversify";

import {
	IPriceService,
	PriceServiceTimeParam
} from "../../Interfaces/IPriceService";
import { Blockchain } from "../../Values/Blockchain";

@injectable()
export class CryptoCompareApiService implements IPriceService {
	async getBlockchainNativeTokenUsdPrice(
		blockchain: Blockchain,
		_time: PriceServiceTimeParam = new Date()
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
		amount: BigNumber | string,
		time: PriceServiceTimeParam = new Date()
	): Promise<BigNumber> {
		const price = await this.getBlockchainNativeTokenUsdPrice(
			blockchain,
			time
		);
		return price.multipliedBy(amount);
	}
}
