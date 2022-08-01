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
import { WhaleSaved } from "../../PubSub/Messages/WhaleSaved";
import { IBlockchainService } from "../../Interfaces/IBlockchainService";
import { TxDiscovered } from "../../PubSub/Messages/TxDiscovered";
import { checksumed } from "../../Utils/Address";

@injectable()
export class SaveWhale implements IStandaloneApps {
  constructor(
    @inject(IocKey.TokenRepository) private walletRepository: IWalletRepository,
    @inject(IocKey.BlockchainService)
    private blockchainService: IBlockchainService,
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
    const existingWhale = await this.walletRepository.findOne({
      address: checksumed(address),
      blockchain,
    });
    if (existingWhale) {
      return;
    }
    const whale = Wallet.create({
      address,
      blockchain,
      type: WalletType.Whale,
      createdAt: new Date(),
      relations: [],
      tags: [],
    });
    this.findWhaleTxsAndPublish({ address, blockchain });
    await this.walletRepository.save(whale);
    this.broker.publish(new WhaleSaved(blockchain, { blockchain, address }));
  }
  private async findWhaleTxsAndPublish({
    address,
    blockchain,
  }: WhaleDiscoveredPayload) {
    const txs = await this.blockchainService.getTransactionsForAddress(
      blockchain,
      address
    );
    txs.forEach((hash) => {
      this.broker.publish(new TxDiscovered(blockchain, { blockchain, hash }));
    });
  }
}
