import { inject, injectable } from "inversify";
import { ILogger } from "../../Interfaces/ILogger";
import { IConfig } from "../../Interfaces/IConfig";
import { createAddrMap } from "../Utils/Address";
import { isNativeTokenTx } from "../Utils/Tx";
import { ContractMap } from "../Types/Mappings";
import { IocKey } from "../../Ioc/IocKey";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { toPrecision } from "../Utils/Amount";

import { RawBlock } from "../Types/RawBlock";
import { IContractRepository } from "../Repository/IContractRepository";
import { IAppBroker } from "../Interfaces/IAppBroker";

import { TxDiscovered } from "../PubSub/Messages/TxDiscovered";
import { BlockReceivedPayload } from "../PubSub/Messages/BlockReceived";
import { ethers } from "ethers";
import { Subscription } from "../../Infrastructure/Broker/Subscription";
import BigNumber from "bignumber.js";

@injectable()
export class FindDirectTx implements IStandaloneApps {
  constructor(
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Config) private config: IConfig,
    @inject(IocKey.Broker) private broker: IAppBroker,
    @inject(IocKey.ContractRepository)
    private contractRepository: IContractRepository
  ) {}

  async start() {
    this.logger.log({
      type: "find-direct-tx.start",
    });
    this.broker.subscribe(Subscription.FindDirectTx, this.onBlock.bind(this));
  }

  async onBlock({ block, blockchain }: BlockReceivedPayload) {
    const contracts = await this.getSmartContractsOfInterest();
    for (const tx of block.transactions) {
      if (
        this.isBigNativeTx(tx) ||
        this.isAgainstContractOfInterest(tx, contracts)
      ) {
        this.broker.publish(
          new TxDiscovered(blockchain, { blockchain, hash: tx.hash })
        );
      }
    }
  }

  private isBigNativeTx(tx: ethers.providers.TransactionResponse): boolean {
    return (
      isNativeTokenTx(tx) &&
      new BigNumber(tx.value._hex).isGreaterThanOrEqualTo(
        toPrecision(this.config.txRules.minNativeTransferValue)
      )
    );
  }

  private isAgainstContractOfInterest(
    txRes: ethers.providers.TransactionResponse,
    addressesOfInterest: ContractMap
  ): boolean {
    return !!addressesOfInterest[txRes.to!];
  }

  private async getSmartContractsOfInterest(): Promise<ContractMap> {
    const { data: contracts } = await this.contractRepository.findAll();
    return createAddrMap(
      contracts.reduce((map, contract) => {
        return {
          ...map,
          [contract.address]: contract,
        };
      }, {})
    );
  }
}
