import { Axios, AxiosRequestConfig } from "axios";
import BigNumber from "bignumber.js";
import Bottleneck from "bottleneck";
import { inject, injectable } from "inversify";
import { IConfig } from "../../../Interfaces/IConfig";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { ICache } from "../../Interfaces/ICache";
import {
	IPriceService,
	PriceServiceTimeParam
} from "../../Interfaces/IPriceService";
import { ensureDate } from "../../Utils/Date";
import { noop } from "../../Utils/Misc";
import { truncateNumberBy } from "../../Utils/Numbers";
import { Blockchain } from "../../Values/Blockchain";
import { GetPriceError } from "./Errors";

const buildCacheKey = (time: number) => `finnhub.price_at.${time}`;
// const SIXTY_REQ_PER_MIN = Math.floor(60_000 / 60);
const TWELVE_HOURS_IN_S = 12 * 60 * 60;
const CACHE_DURATION = TWELVE_HOURS_IN_S;
@injectable()
export class FinnhubApiService implements IPriceService {
	private baseUrl = "https://finnhub.io/api";
	private client: Axios;
	private resolutionInMinutes = 15;
	private bottleneck = new Bottleneck({ id: this.baseUrl, maxConcurrent: 5 });
	constructor(
		@inject(IocKey.Config)
		private config: IConfig,
		@inject(IocKey.Logger)
		private logger: ILogger,
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
		time: PriceServiceTimeParam = new Date()
	): Promise<BigNumber> {
		return this.bottleneck.schedule(async () => {
			const [from, to] = this.getTimeRangeForSingleRange(time);
			const cachedValue = await this.cache.get<number>(
				buildCacheKey(from)
			);
			if (cachedValue) {
				return new BigNumber(cachedValue);
			}
			const endpoint = `/v1/crypto/candle?symbol=BINANCE:${blockchain.nativeTokenSymbol}USDT&resolution=${this.resolutionInMinutes}&from=${from}&to=${to}`;
			const res = await this.client
				.get<{ c: number[] }>(endpoint)
				.catch((error) => {
					this.logger.error({
						message: "[Finnhub] Get price call failed",
						type: "finnhub-api.call.failed.get-crypto-candle",
						context: {
							blockchain: blockchain.id
						},
						error
					});
					throw error;
				});

			const price = res?.data?.c?.[0];
			if (!price) {
				throw new GetPriceError(
					blockchain.nativeTokenSymbol,
					from * 1000
				);
			}
			this.cache
				.set(buildCacheKey(from), price, CACHE_DURATION)
				.then(noop)
				.catch(noop);
			return new BigNumber(price);
		});
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

	getTimeRangeForSingleRange(timestamp: Date) {
		timestamp = ensureDate(timestamp);
		timestamp.setSeconds(0);
		timestamp.setMilliseconds(0);
		timestamp.setMinutes(
			truncateNumberBy(timestamp.getMinutes(), this.resolutionInMinutes)
		);
		const from = Math.floor(timestamp.getTime() / 1000);
		const to = from + 1;
		return [from, to];
	}
}
