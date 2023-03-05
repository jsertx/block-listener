import { inject, injectable } from "inversify";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";

import { ITokenService } from "../Interfaces/ITokenService";
import { BlockchainId } from "../Values/Blockchain";

@injectable()
export class Playground {
	constructor(
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.TokenService) private tokenService: ITokenService
	) {}

	async execute(): Promise<void> {
		const t = await this.tokenService.fetchTokenDataWithPrice(
			BlockchainId.Ethereum,
			"0x32cC9fa9977ec44bb3cA561787deEbBC731C956b"
		);
	}
}
