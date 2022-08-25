import { inject } from "inversify";
import { interfaces, controller, httpGet } from "inversify-express-utils";
import { ICache } from "../../../App/Interfaces/ICache";
import { IConfig } from "../../../Interfaces/IConfig";
import { IocKey } from "../../../Ioc/IocKey";
import { StatusResponseDto } from "../Dto/StatusDto";
import { IApiResponse } from "../Types/Response";

@controller("/")
export class StatusController implements interfaces.Controller {
	constructor(
		@inject(IocKey.Config) private config: IConfig,
		@inject(IocKey.Cache) private cache: ICache
	) {}
	@httpGet("/")
	async index(): Promise<IApiResponse<StatusResponseDto>> {
		return {
			success: true,
			data: {
				latestBlocks: await this.getLatestBlocks()
			}
		};
	}

	async getLatestBlocks(): Promise<StatusResponseDto["latestBlocks"]> {
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
