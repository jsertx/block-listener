import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import { ITokenRepository } from "../../Repository/ITokenRepository";
import { IStandaloneApps } from "../../Interfaces/IStandaloneApps";
import { ITxRepository } from "../../Repository/ITxRepository";
import { IConfig } from "../../../Interfaces/IConfig";
import { Blockchain, BlockchainId } from "../../Values/Blockchain";
import { noop } from "../../Utils/Misc";
import { TokenDiscovered } from "../../PubSub/Messages/TokenDiscovered";
import { Token } from "../../Entities/Token";

@injectable()
export class RequeueMissingTokens implements IStandaloneApps {
	constructor(
		@inject(IocKey.Config)
		private config: IConfig,
		@inject(IocKey.TxRepository)
		private txRepository: ITxRepository,
		@inject(IocKey.TokenRepository)
		private tokenRepository: ITokenRepository,
		@inject(IocKey.Broker) private broker: IBroker,
		@inject(IocKey.Logger) private logger: ILogger
	) {}

	start(): void {
		this.processAllBlockchainsAndRepeat().then(noop).catch(noop);
	}

	async processAllBlockchainsAndRepeat() {
		for (const blockchain of this.config.enabledBlockchains) {
			await this.processBlockchain(blockchain);
		}
		setTimeout(
			() => this.processAllBlockchainsAndRepeat().then(noop).catch(noop),
			5 * 60 * 1000
		);
	}

	async processBlockchain(blockchain: BlockchainId): Promise<void> {
		const { addresses } = await this.txRepository.getAllTokensFoundInSwaps(
			blockchain
		);
		const allTokensByAddr: Record<string, Token> =
			await this.tokenRepository
				.findTokensByBlockchainAddress({
					addresses,
					blockchain: new Blockchain(blockchain)
				})
				.then((tokens) => tokens.reduce(tokensByAddrReducer, {}));

		for (const address of addresses) {
			const found = allTokensByAddr[address.toLowerCase()];
			if (!found) {
				this.logger.log({
					type: "requeue-missing-tokens",
					message: `Recovered token ${address}@${blockchain}`,
					context: {
						blockchain,
						address
					}
				});
				this.broker
					.publish(
						new TokenDiscovered({
							address,
							blockchain
						})
					)
					.then(noop)
					.catch(noop);
			}
		}
	}
}
function tokensByAddrReducer(map: Record<string, Token>, token: Token) {
	return { ...map, [token.address.toLowerCase()]: token };
}
