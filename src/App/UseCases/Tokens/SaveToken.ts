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
import { Token } from "../../Entities/Token";
import { BlockchainId } from "../../Values/Blockchain";
import { Axios } from "axios";
import * as cheerio from "cheerio";

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
			await this.updateLogo(existingToken);
			await this.tokenRepository.save(existingToken);
			return;
		}
		const [token] = await this.tokenService.fetchTokensData(blockchain, [
			address
		]);
		await this.updateLogo(token);
		await this.tokenRepository.save(token);
		this.logger.log({
			type: "save-token.saved",
			message: `Token saved: ${token.symbol} ${address}@${blockchain}`,
			context: { address, blockchain }
		});
	}

	private async updateLogo(token: Token) {
		let logoUrl: string | undefined;
		if (token.blockchain.equals(BlockchainId.Ethereum)) {
			logoUrl = await getLogoFromEtherScan(token);
		}

		if (logoUrl) {
			token.addLogo(logoUrl);
		}
	}

	getMessageContextTrace({ address, blockchain }: TokenDiscoveredPayload) {
		return { address, blockchain };
	}
}

async function getLogoFromEtherScan(token: Token): Promise<string | undefined> {
	const baseURL = "https://etherscan.io";
	const client = new Axios({ baseURL });
	const res = await client.get(`/token/${token.address}`);
	const $ = cheerio.load(res.data);
	const path = $(".js-token-avatar").attr("src");
	if (!path || path.trim() === "") {
		return undefined;
	}
	return `${baseURL}/${path}`;
}
