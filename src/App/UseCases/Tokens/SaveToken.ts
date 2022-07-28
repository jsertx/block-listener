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

@injectable()
export class SaveToken implements IStandaloneApps {
  constructor(
    @inject(IocKey.TokenRepository) private tokenRepository: ITokenRepository,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.TxProcessor) private txProcessor: ITxProcessor
  ) {}

  async start() {
    this.logger.log({
      type: "save-token.started",
      message: "Save token listener has started",
    });
    this.eventBus.subscribe(
      EventChannel.TokenDiscovered,
      this.execute.bind(this)
    );
  }

  async execute({ address, blockchain }: RawTokenId) {
    const existingToken = await this.tokenRepository.findOne({
      address,
      blockchain: blockchain.id,
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
      blockchain: blockchain.id,
      decimals,
      name,
      symbol,
      useAsBaseForPairDiscovery: false,
    });
    await this.tokenRepository.save(token);
  }
}
