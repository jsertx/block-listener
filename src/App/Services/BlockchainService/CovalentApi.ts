import { Axios, AxiosRequestConfig } from "axios";
import { inject, injectable } from "inversify";
import { IConfig } from "../../../Interfaces/IConfig";
import { IocKey } from "../../../Ioc/IocKey";
import { IBlockchainService } from "../../Interfaces/IBlockchainService";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";

@injectable()
export class CovalentApi implements IBlockchainService {
	private baseUrl = "https://api.covalenthq.com/v1/";
	private client: Axios;
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
		return this.client
			.get(`/${chainId}/address/${address}/transactions_v2`)
			.then((res) => res?.data?.items.map((tx: any) => tx.tx_hash) || []);
	}
}
