import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import { ITokenRepository } from "../../Repository/ITokenRepository";
import { TokenDiscoveredPayload } from "../../PubSub/Messages/TokenDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";
import { checksumed } from "../../Utils/Address";
import { Executor } from "../../../Infrastructure/Broker/Executor";
import { ITokenService } from "../../Interfaces/ITokenService";
@injectable()
export class SaveToken extends Executor<TokenDiscoveredPayload> {
	constructor(
		@inject(IocKey.TokenRepository)
		private tokenRepository: ITokenRepository,
		@inject(IocKey.Broker) broker: IBroker,
		@inject(IocKey.Logger) logger: ILogger,
		@inject(IocKey.TokenService) private tokenService: ITokenService
	) {
		super(logger, broker, Subscription.SaveToken);
	}

	async execute({ address, blockchain }: TokenDiscoveredPayload) {
		const existingToken = await this.tokenRepository.findOne({
			address: checksumed(address),
			blockchain
		});
		if (existingToken) {
			return;
		}
		const [token] = await this.tokenService.fetchTokensData(blockchain, [
			address
		]);
		await this.tokenRepository.save(token);
		this.logger.log({
			type: "save-token.saved",
			message: `Token saved: ${token.symbol} ${address}@${blockchain}`,
			context: { address, blockchain }
		});
	}

	getMessageContextTrace({ address, blockchain }: TokenDiscoveredPayload) {
		return { address, blockchain };
	}
}
