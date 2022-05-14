import { ethers } from "ethers";
import { inject, injectable } from "inversify";
import { ContractType } from "../Domain/Entities/Address";
import { Channel } from "../Enums/Channel";
import { IBroker } from "../Interfaces/IBroker";
import { ILogger } from "../Interfaces/ILogger";
import { IAddressRepository } from "../Interfaces/Repository/IAddressRepository";
import { IocKey } from "../Ioc/IocKey";
import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { createAddrMap } from "../Utils/Address";
import { isNativeTokenTx } from "../Utils/Tx";
import { AddressMap } from "../Types/Mappings";
import { Opt } from "../Types/Helpers";
import { IConfig } from "../Interfaces/IConfig";
import { toPrecision } from "../Utils/Amount";
import { UnprocessedTx } from "../Domain/Entities/Tx";

@injectable()
export class ProcessTx {
  constructor(
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Config) private config: IConfig,
    @inject(IocKey.Broker) private broker: IBroker,
    @inject(IocKey.AddressRepository)
    private addressRepository: IAddressRepository
  ) {}

  async execute() {
    this.logger.log({
      type: "find-direct-tx.start",
    });
    this.broker.subscribe(Channel.ProcessTx, this.onTx.bind(this));
  }

  async onTx(unprocessedTx: UnprocessedTx) {
    const addressesOfInterest = await this.getSmartContractsOfInterest();
    const channel = this.getPublicationChannel(
      unprocessedTx,
      addressesOfInterest
    );
    if (channel) {
      this.broker.publish(channel, unprocessedTx);
    }
  }

  private getPublicationChannel(
    { raw }: UnprocessedTx,
    addressesOfInterest: AddressMap
  ): Opt<Channel> {
    if (isNativeTokenTx(raw) && raw.value.gte("0")) {
      return Channel.SaveEthTransferTx;
    }
    const address = raw.to && addressesOfInterest[raw.to];
    if (!address) {
      return undefined;
    }

    if (address.contract) {
      return {
        [ContractType.DexRouter]: Channel.SaveDirectDexTx,
        [ContractType.Token]: Channel.SaveDirectTokenTx,
      }[address.contract.type];
    }
  }

  private async getSmartContractsOfInterest(): Promise<AddressMap> {
    const addresses = await this.addressRepository.findAll();
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
