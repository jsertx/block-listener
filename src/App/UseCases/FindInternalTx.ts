import { inject, injectable } from "inversify";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";

import PromiseThrottle from "promise-throttle";
import { IProviderFactory } from "../Interfaces/IProviderFactory";

import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { IContractRepository } from "../Repository/IContractRepository";
import { Contract } from "../Entities/Contract";
import { ethers } from "ethers";
import { flattenReducer, onlyUniqueFilter } from "../Utils/Array";
import { IAppBroker } from "../Interfaces/IAppBroker";
import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { TxDiscovered } from "../PubSub/Messages/TxDiscovered";
import { Subscription } from "../../Infrastructure/Broker/Subscription";
import { BlockReceivedPayload } from "../PubSub/Messages/BlockReceived";

interface BlockFetchingConfig {
  fromBlock: number;
  toBlock: number;
  skip: boolean;
  requestsPerSecond: number;
}

@injectable()
export class FindInternalTx implements IStandaloneApps {
  constructor(
    @inject(IocKey.Broker) private broker: IAppBroker,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.ContractRepository)
    private contractRepository: IContractRepository,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async start() {
    this.broker.subscribe(Subscription.FindInternalTx, this.onBlock.bind(this));
  }

  async onBlock({ block, blockchain }: BlockReceivedPayload) {
    const { data: contracts } = await this.contractRepository.findAll();

    const { fromBlock, toBlock, skip, requestsPerSecond } =
      this.getBlockFetchingRange(block);
    if (skip) {
      return;
    }

    if (contracts.length === 0) {
      return;
    }

    const txHashesBulks: Array<string[]> = await new PromiseThrottle({
      requestsPerSecond,
    }).addAll(
      contracts.map(
        (contract) => () => this.getContractEvents(contract, fromBlock, toBlock)
      )
    );
    const txHashes = txHashesBulks
      .reduce<string[]>(flattenReducer, [])
      .filter(onlyUniqueFilter);

    txHashes.forEach((hash) => {
      this.broker.publish(new TxDiscovered(blockchain, { blockchain, hash }));
    });
  }

  private async getContractEvents(
    contract: Contract,
    fromBlock: number | undefined,
    toBlock: number | undefined
  ): Promise<string[]> {
    if (!contract.abi) {
      throw new Error(
        `This contract has no ABI:  ${contract.address}@${contract.blockchain}`
      );
    }

    const provider = await this.providerFactory.getProvider(
      contract.blockchain
    );

    const ethersContract = new ethers.Contract(
      contract.address,
      contract.abi,
      provider
    );

    const events = await ethersContract.queryFilter(
      {
        address: contract.address,
      },
      fromBlock,
      toBlock
    );
    return events
      .map((event) => event.transactionHash)
      .filter(onlyUniqueFilter);
  }

  private getBlockFetchingRange(
    block: BlockWithTransactions
  ): BlockFetchingConfig {
    const requestsPerSecond = 100;
    const blockBatchSize = 100;
    const blocksToSkipUntilFetch = blockBatchSize / 2;

    const fromBlock = block.number + blockBatchSize;
    const toBlock = block.number;
    // we want to iterate over same block twice to try to get lost transactions in previous query
    const skip = block.number % blocksToSkipUntilFetch > 0;

    return { fromBlock, toBlock, skip, requestsPerSecond };
  }
}
