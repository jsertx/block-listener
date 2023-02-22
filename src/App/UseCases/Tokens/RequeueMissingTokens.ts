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
import { isSameAddress } from "../../Utils/Address";
import { TokenDiscovered } from "../../PubSub/Messages/TokenDiscovered";
import { CronSchedule } from "../../Types/CronSchedule";
import Cron from "node-cron";

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
		Cron.schedule(CronSchedule.EveryMinute, () => {
			for (const blockchain of this.config.enabledBlockchains) {
				this.processBlockchain(blockchain).then(noop).catch(noop);
			}
		});
	}

	async processBlockchain(blockchain: BlockchainId): Promise<void> {
		const { addresses } = await this.txRepository.getAllTokensFoundInSwaps(
			blockchain
		);
		const allTokens =
			await this.tokenRepository.findTokensByBlockchainAddress({
				addresses,
				blockchain: new Blockchain(blockchain)
			});

		for (const address of addresses) {
			const found = allTokens.find((token) =>
				isSameAddress(token.address, address)
			);
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
