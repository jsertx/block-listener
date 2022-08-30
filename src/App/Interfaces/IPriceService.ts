import BigNumber from "bignumber.js";
import { Blockchain } from "../Values/Blockchain";

export type PriceServiceTimeParam = Date | number;
export interface IPriceService {
	getBlockchainNativeTokenUsdPrice(
		blockchain: Blockchain,
		time: PriceServiceTimeParam
	): Promise<BigNumber>;
	getBlockchainNativeTokenUsdValue(
		blockchain: Blockchain,
		amount: BigNumber | string,
		time: PriceServiceTimeParam
	): Promise<BigNumber>;
}
