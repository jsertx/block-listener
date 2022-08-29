import { Axios, AxiosRequestConfig } from "axios";
import BigNumber from "bignumber.js";
import { inject, injectable } from "inversify";
import { IConfig } from "../../../Interfaces/IConfig";
import { IocKey } from "../../../Ioc/IocKey";
import { ICache } from "../../Interfaces/ICache";
import {
	IPriceService,
	PriceServiceTimeParam
} from "../../Interfaces/IPriceService";
import { ensureDate } from "../../Utils/Date";
import { Blockchain } from "../../Values/Blockchain";

const buildCacheKey = (time: number) => `finnhub_price_at_${time}`;

@injectable()
export class FinnhubApiService implements IPriceService {
	private baseUrl = "https://finnhub.io/api";
	private client: Axios;
	private resolution = 30;
	constructor(
		@inject(IocKey.Config)
		private config: IConfig,
		@inject(IocKey.Cache)
		private cache: ICache
	) {
		this.client = new Axios({
			baseURL: this.baseUrl
		});
		this.client.interceptors.request.use((config: AxiosRequestConfig) => {
			const glue = config.url?.includes("?") ? "&" : "?";
			return {
				...config,
				url: `${config.url}${glue}token=${this.config.finnhub.apiKey}`
			};
		});
		this.client.interceptors.response.use((res) => {
			return { ...res, data: JSON.parse(res.data) };
		});
	}
	async getBlockchainNativeTokenUsdPrice(
		blockchain: Blockchain,
		time: PriceServiceTimeParam = Date.now()
	): Promise<BigNumber> {
		const [from, to] = getTimeRangeForSingleRange(time);
		const cachedValue = await this.cache.get<number>(buildCacheKey(from));
		if (cachedValue) {
			return new BigNumber(cachedValue);
		}
		const res = await this.client.get<{ c: number[] }>(
			`/v1/crypto/candle?symbol=BINANCE:${blockchain.nativeTokenSymbol}USDT&resolution=${this.resolution}&from=${from}&to=${to}`
		);
		const price = res.data.c[0];
		await this.cache.set(buildCacheKey(from), price);
		return new BigNumber(price);
	}

	async getBlockchainNativeTokenUsdValue(
		blockchain: Blockchain,
		amount: BigNumber | string,
		time: PriceServiceTimeParam = Date.now()
	): Promise<BigNumber> {
		const price = await this.getBlockchainNativeTokenUsdPrice(
			blockchain,
			time
		);
		return price.multipliedBy(amount);
	}
}

function getTimeRangeForSingleRange(timestamp: Date | number) {
	timestamp = ensureDate(timestamp);
	timestamp.setSeconds(0);
	// set minutes to o'clock or 30'
	timestamp.setMinutes(timestamp.getMinutes() > 30 ? 0 : 30);
	const from = Math.floor(timestamp.getTime() / 1000);
	const to = from + 1;
	return [from, to];
}
