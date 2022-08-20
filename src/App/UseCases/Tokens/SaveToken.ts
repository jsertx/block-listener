import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import {
	IProviderFactory,
	multicallResultHelper
} from "../../Interfaces/IProviderFactory";
import { ITxProcessor } from "../../Services/TxProcessor/ITxProcessor";
import { ITokenRepository } from "../../Repository/ITokenRepository";
import { Token } from "../../Entities/Token";
import { ERC20 } from "../../Services/SmartContract/ABI/ERC20";
import { TokenDiscoveredPayload } from "../../PubSub/Messages/TokenDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";
import { checksumed } from "../../Utils/Address";
import { Executor } from "../../../Infrastructure/Broker/Executor";
@injectable()
export class SaveToken extends Executor<TokenDiscoveredPayload> {
	constructor(
		@inject(IocKey.TokenRepository)
		private tokenRepository: ITokenRepository,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.Broker) broker: IBroker,
		@inject(IocKey.Logger) logger: ILogger,
		@inject(IocKey.TxProcessor) private txProcessor: ITxProcessor
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
		const multicall = this.providerFactory.getMulticallProvider(blockchain);
		const select = await multicall
			.call([
				{
					abi: ERC20,
					reference: address,
					contractAddress: address,
					calls: [
						{
							methodName: "name",
							reference: "name",
							methodParameters: []
						},
						{
							methodName: "symbol",
							reference: "symbol",
							methodParameters: []
						},
						{
							methodName: "decimals",
							reference: "decimals",
							methodParameters: []
						}
					]
				}
			])
			.then(multicallResultHelper);

		const [name, symbol, decimals] = select(address, [
			"name",
			"symbol",
			"decimals"
		]);
		if (!name || !symbol || !decimals) {
			throw new Error("Invalid token data received");
		}
		const token = Token.create({
			address,
			blockchain,
			decimals,
			name,
			symbol,
			useAsBaseForPairDiscovery: false,
			isNativeWrapped: false,
			isStable: false
		});
		await this.tokenRepository.save(token);
	}
}
