import { Axios, AxiosRequestConfig } from "axios";
import Bottleneck from "bottleneck";
import { inject, injectable } from "inversify";
import { IConfig } from "../../../Interfaces/IConfig";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import {
	IBlockchainService,
	TxMetadata
} from "../../Interfaces/IBlockchainService";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";

// https://github.com/SGrondin/bottleneck#step-1-of-3
const FIVE_REQ_PER_SEC = Math.floor(1000 / 4);
@injectable()
export class CovalentApi implements IBlockchainService {
	private baseUrl = "https://api.covalenthq.com/v1/";
	private client: Axios;
	private bottleneck: Bottleneck = new Bottleneck({
		id: this.baseUrl,
		minTime: FIVE_REQ_PER_SEC,
		maxConcurrent: 4
	});
	constructor(
		@inject(IocKey.Config) private config: IConfig,
		@inject(IocKey.Logger) private logger: ILogger
	) {
		this.client = new Axios({ baseURL: this.baseUrl });
		this.client.interceptors.request.use((config: AxiosRequestConfig) => {
			return {
				...config,
				url: `${config.url}/?key=${this.config.covalent.apiKey}`
			};
		});
		this.client.interceptors.response.use((res) => {
			return JSON.parse(res.data);
		});
	}

	async getWalletTxsWithMetadata(
		blockchain: BlockchainId,
		address: string
	): Promise<TxMetadata[]> {
		const chainId = new Blockchain(blockchain).chainId;
		const endpoint = `/${chainId}/address/${address}/transactions_v2`;
		const res = await this.bottleneck.schedule(() =>
			this.client.get(endpoint).catch((error) => {
				this.logger.error({
					message: "[Covalent] Get wallet txs call failed",
					type: "covalent-api.call.failed.get-wallet-txs",
					context: {
						blockchain,
						address
					},
					error
				});
				throw error;
			})
		);
		if (!res || !res.data || !res.data.items) {
			return [];
		}
		const resData: Array<{ tx_hash: string; block_height: number }> =
			res.data.items;

		return resData.map((tx) => ({
			hash: tx.tx_hash,
			blockHeight: `${tx.block_height}`
		}));
	}
}
