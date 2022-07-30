import { inject, injectable } from "inversify";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { IBroker } from "../../../Interfaces/IBroker";
import { IStandaloneApps } from "../../Interfaces/IStandaloneApps";

import { Wallet } from "../../Entities/Wallet";
import { WalletType } from "../../Values/WalletType";
import { IWalletRepository } from "../../Repository/IWalletRepository";
import { WhaleDiscoveredPayload } from "../../PubSub/Messages/WhaleDiscovered";
import { Subscription } from "../../../Infrastructure/Broker/Subscription";

@injectable()
export class SaveWhale implements IStandaloneApps {
  constructor(
    @inject(IocKey.TokenRepository) private walletRepository: IWalletRepository,
    @inject(IocKey.Broker) private broker: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async start() {
    this.logger.log({
      type: "save-whale.started",
      message: "Save whale listener has started",
    });
    this.broker.subscribe(Subscription.SaveWhale, this.execute.bind(this));
  }

  async execute({ address, blockchain }: WhaleDiscoveredPayload) {
    const whale = Wallet.create({
      address,
      blockchain,
      type: WalletType.Whale,
      createdAt: new Date(),
      relations: [],
      tags: [],
    });
    const existingWhale = await this.walletRepository.findOne({
      address,
      blockchain,
    });
    if (existingWhale) {
      return;
    }
    await this.walletRepository.save(whale);
  }
}
