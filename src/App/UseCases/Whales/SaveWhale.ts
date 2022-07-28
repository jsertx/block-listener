import { inject, injectable } from "inversify";
import { ITxRepository } from "../../Repository/ITxRepository";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { EventChannel } from "../../Enums/Channel";
import { IBroker } from "../../../Interfaces/IBroker";
import { IProviderFactory } from "../../Interfaces/IProviderFactory";
import { IStandaloneApps } from "../../Interfaces/IStandaloneApps";
import { RawTx, Tx } from "../../Entities/Tx";
import { TxType } from "../../Values/Tx";
import { RawTxId } from "../../Types/RawTxId";
import { isSmartContractCall } from "../../Utils/Tx";

import { LogDecoder, TxDecoder } from "@maticnetwork/eth-decoder";
import { ethers } from "ethers";
import { TransactionLog } from "../../Types/TransactionLog";
import { allAbiList } from "../../Services/SmartContract/ABI";
import { ITxProcessor } from "../../Services/TxProcessor/ITxProcessor";
import { ITokenRepository } from "../../Repository/ITokenRepository";
import { RawTokenId } from "../../Types/RawTokenId";
import { Token, TokenIdProps } from "../../Entities/Token";
import { ERC20 } from "../../Services/SmartContract/ABI/ERC20";
import { RawWalletId } from "../../Types/RawWalletId";
import { Wallet } from "../../Entities/Wallet";
import { WalletType } from "../../Values/WalletType";
import { IWalletRepository } from "../../Repository/IWalletRepository";

@injectable()
export class SaveWhale implements IStandaloneApps {
  constructor(
    @inject(IocKey.TokenRepository) private walletRepository: IWalletRepository,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async start() {
    this.logger.log({
      type: "save-whale.started",
      message: "Save whale listener has started",
    });
    this.eventBus.subscribe(
      EventChannel.WhaleDiscovered,
      this.execute.bind(this)
    );
  }

  async execute({ address, blockchain }: RawWalletId) {
    const whale = Wallet.create({
      address,
      blockchain: blockchain.id,
      type: WalletType.Whale,
      createdAt: new Date(),
      relations: [],
      tags: [],
    });
    const existingWhale = await this.walletRepository.findOne({
      address,
      blockchain: blockchain.id,
    });
    if (existingWhale) {
      return;
    }
    await this.walletRepository.save(whale);
  }
}
