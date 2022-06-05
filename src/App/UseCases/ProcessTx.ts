import { ethers } from "ethers";
import { inject, injectable } from "inversify";

import { IBroker } from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";
import { IConfig } from "../../Interfaces/IConfig";

import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { createAddrMap } from "../Utils/Address";
import { isNativeTokenTx } from "../Utils/Tx";
import { ContractMap } from "../Types/Mappings";
import { Opt } from "../Types/Helpers";

import { toPrecision } from "../Utils/Amount";
import { UnprocessedTx } from "../Models/Tx";
import { Channel } from "../Enums/Channel";
import { IocKey } from "../../Ioc/IocKey";
import { IAddressService } from "../../Domain/Interfaces/IAddressService";
import { ContractType } from "../../Domain/Values/ContractType";
import { IListenerUseCase } from "../../Interfaces/IListenerUseCase";

@injectable()
export class ProcessTx implements IListenerUseCase {
  constructor(
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Config) private config: IConfig,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.AddressService)
    private contractService: IAddressService
  ) {}

  async listen() {
    this.logger.log({
      type: "find-direct-tx.start",
    });
    this.eventBus.subscribe(Channel.ProcessTx, this.onTx.bind(this));
  }

  async onTx(unprocessedTx: UnprocessedTx) {
    const addressesOfInterest = await this.getSmartContractsOfInterest();
    const channel = this.getPublicationChannel(
      unprocessedTx,
      addressesOfInterest
    );
    if (channel) {
      this.eventBus.publish(channel, unprocessedTx);
    }
  }

  private getPublicationChannel(
    { raw }: UnprocessedTx,
    addressesOfInterest: ContractMap
  ): Opt<Channel | undefined> {
    if (isNativeTokenTx(raw) && raw.value.gte("0")) {
      return Channel.SaveEthTransferTx;
    }
    const contract = addressesOfInterest[raw.to!];
    if (!contract) {
      return undefined;
    }

    return {
      [ContractType.UniswapRouterV2Like]: Channel.SaveDirectDexTx,
      [ContractType.TokenErc20]: Channel.SaveDirectTokenTx,
      [ContractType.ArbBot]: undefined,
      [ContractType.MevBot]: undefined,
    }[contract.type];
  }

  private async getSmartContractsOfInterest(): Promise<ContractMap> {
    const addresses = await this.contractService.findAllContracts();
    return createAddrMap(
      addresses.reduce((map, address) => {
        return {
          ...map,
          [address.address]: address,
        };
      }, {})
    );
  }
}
