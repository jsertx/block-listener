import { Axios, AxiosRequestConfig } from "axios";
import Bottleneck from "bottleneck";
import { inject, injectable } from "inversify";
import { IConfig } from "../../../Interfaces/IConfig";
import { IocKey } from "../../../Ioc/IocKey";
import { IBlockchainService } from "../../Interfaces/IBlockchainService";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";

// https://github.com/SGrondin/bottleneck#step-1-of-3
const FIVE_REQ_PER_SEC = Math.floor(1000 / 5);
@injectable()
export class CovalentApi implements IBlockchainService {
	private baseUrl = "https://api.covalenthq.com/v1/";
	private client: Axios;
	private bottleneck: Bottleneck = new Bottleneck({
		minTime: FIVE_REQ_PER_SEC
	});
	constructor(@inject(IocKey.Config) private config: IConfig) {
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

	getWalletTxsHashes(
		blockchain: BlockchainId,
		address: string
	): Promise<string[]> {
		const chainId = new Blockchain(blockchain).chainId;
		return this.bottleneck.schedule(() =>
			this.client
				.get(`/${chainId}/address/${address}/transactions_v2`)
				.then(
					(res) => res?.data?.items.map((tx: any) => tx.tx_hash) || []
				)
		);
	}
}
