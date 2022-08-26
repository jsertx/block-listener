import { inject } from "inversify";
import { interfaces, controller, httpGet } from "inversify-express-utils";
import { ICache } from "../../../App/Interfaces/ICache";
import { ITokenRepository } from "../../../App/Repository/ITokenRepository";
import { ITxRepository } from "../../../App/Repository/ITxRepository";
import { IWalletRepository } from "../../../App/Repository/IWalletRepository";
import { TxType } from "../../../App/Values/TxType";
import { IConfig } from "../../../Interfaces/IConfig";
import { IocKey } from "../../../Ioc/IocKey";
import { StatusResponseDto } from "../Dto/StatusDto";
import { IApiResponse } from "../Types/Response";

@controller("/")
export class StatusController implements interfaces.Controller {
	constructor(
		@inject(IocKey.Config) private config: IConfig,
		@inject(IocKey.Cache) private cache: ICache,
		@inject(IocKey.TokenRepository)
		private tokenRepository: ITokenRepository,
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.TxRepository) private txRepository: ITxRepository
	) {}
	@httpGet("/")
	async index(): Promise<IApiResponse<StatusResponseDto>> {
		return {
			success: true,
			data: {
				latestBlocks: await this.getLatestBlocks(),
				counter: await this.getCounter()
			}
		};
	}
	private async getCounter(): Promise<StatusResponseDto["counter"]> {
		const dexSwaps = await this.txRepository.findAll({
			pageSize: 1,
			page: 1,
			where: { type: TxType.DexSwap }
		});
		const unknownTxs = await this.txRepository.findAll({
			pageSize: 1,
			page: 1,
			where: { type: TxType.Unknown }
		});
		const ethTransfers = await this.txRepository.findAll({
			pageSize: 1,
			page: 1,
			where: { type: TxType.EthTransfer }
		});
		const wallets = await this.walletRepository.findAll({
			pageSize: 1,
			page: 1
		});
		const tokens = await this.tokenRepository.findAll({
			pageSize: 1,
			page: 1
		});

		return {
			tokens: tokens.total,
			wallets: wallets.total,
			txs: {
				dexSwaps: dexSwaps.total,
				ethTransfers: ethTransfers.total,
				unknown: unknownTxs.total
			}
		};
	}
	private async getLatestBlocks(): Promise<
		StatusResponseDto["latestBlocks"]
	> {
		const latestBlocksByChain = await Promise.all(
			this.config.enabledBlockchains.map((blockchain) =>
				this.cache.get(`latest_block_${blockchain}`)
			)
		);
		return this.config.enabledBlockchains.reduce<
			StatusResponseDto["latestBlocks"]
		>((map, blockchain, i) => {
			return { ...map, [blockchain]: latestBlocksByChain[i] };
		}, {});
	}
}
