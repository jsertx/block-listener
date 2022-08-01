import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { IStandaloneApps } from "../../Interfaces/IStandaloneApps";
import { ethers } from "ethers";
import { ITxProcessor } from "../../Services/TxProcessor/ITxProcessor";
import { ITokenRepository } from "../../Repository/ITokenRepository";
import { Token, TokenIdProps } from "../../Entities/Token";
import { ERC20 } from "../../Services/SmartContract/ABI/ERC20";
import { TokenDiscoveredPayload } from "../../PubSub/Messages/TokenDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";
import { checksumed } from "../../Utils/Address";

@injectable()
export class SaveToken implements IStandaloneApps {
  constructor(
    @inject(IocKey.TokenRepository) private tokenRepository: ITokenRepository,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.Broker) private broker: IBroker,
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.TxProcessor) private txProcessor: ITxProcessor
  ) {}

  async start() {
    this.logger.log({
      type: "save-token.started",
      message: "Save token listener has started",
    });
    this.broker.subscribe(Subscription.SaveToken, this.execute.bind(this));
  }

  async execute({ address, blockchain }: TokenDiscoveredPayload) {
    const existingToken = await this.tokenRepository.findOne({
      address: checksumed(address),
      blockchain,
    });
    if (existingToken) {
      return;
    }
    const provider = this.providerFactory.getProvider(blockchain);
    const contract = new ethers.Contract(address, ERC20, provider);
    const [name, decimals, symbol] = await Promise.all([
      contract.name(),
      contract.decimals(),
      contract.symbol(),
    ]);
    const token = Token.create({
      address,
      blockchain,
      decimals,
      name,
      symbol,
      useAsBaseForPairDiscovery: false,
    });
    await this.tokenRepository.save(token);
  }
}
