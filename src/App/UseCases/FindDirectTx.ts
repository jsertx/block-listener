import { inject, injectable } from "inversify";
import { IBroker } from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";
import { IConfig } from "../../Interfaces/IConfig";
import { createAddrMap } from "../Utils/Address";
import { isNativeTokenTx } from "../Utils/Tx";
import { ContractMap } from "../Types/Mappings";
import { RawTransaction } from "../Models/RawTransaction";
import { EventChannel } from "../Enums/Channel";
import { IocKey } from "../../Ioc/IocKey";
import { IAddressService } from "../Interfaces/IAddressService";
import { IListenerUseCase } from "../Interfaces/IListenerUseCase";
import { toPrecision } from "../Utils/Amount";

import { RawBlock } from "../Models/RawBlock";
import { IContractRepository } from "../Repository/IContractRepository";

@injectable()
export class FindDirectTx implements IListenerUseCase {
  constructor(
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Config) private config: IConfig,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.ContractRepository)
    private contractRepository: IContractRepository
  ) {}

  async listen() {
    this.logger.log({
      type: "find-direct-tx.start",
    });
    this.eventBus.subscribe(EventChannel.NewBlock, this.onBlock.bind(this));
  }

  async onBlock({ block, blockchain }: RawBlock) {
    const contracts = await this.getSmartContractsOfInterest();
    for (const raw of block.transactions) {
      const rawTx: RawTransaction = { blockchain, raw };

      if (
        this.isBigNativeTx(rawTx) ||
        this.isAgainstContractOfInterst(rawTx, contracts)
      ) {
        this.eventBus.publish(EventChannel.SaveTx, rawTx);
      }
    }
  }

  private isBigNativeTx({ raw }: RawTransaction): boolean {
    return (
      isNativeTokenTx(raw) &&
      raw.value.gte(toPrecision(this.config.txRules.minEthValue))
    );
  }

  private isAgainstContractOfInterst(
    { raw }: RawTransaction,
    addressesOfInterest: ContractMap
  ): boolean {
    return !!addressesOfInterest[raw.to!];
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
