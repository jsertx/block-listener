import { inject, injectable } from "inversify";
import { ITxRepository } from "../Repository/ITxRepository";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";

import { EventChannel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";
import PromiseThrottle from "promise-throttle";
import { IProviderFactory } from "../Interfaces/IProviderFactory";

import { IListenerUseCase } from "../Interfaces/IListenerUseCase";
import { RawBlock } from "../Models/RawBlock";
import { IContractRepository } from "../Repository/IContractRepository";
import { BlockchainId } from "../Values/Blockchain";
import { Contract } from "../Entities/Contract";
import { ethers } from "ethers";
import { flattenReducer, onlyUniqueFilter } from "../Utils/Array";
import { RawTxId } from "../Models/RawTxId";

interface BlockFetchingConfig {
  fromBlock: number;
  toBlock: number;
  skip: boolean;
  requestsPerSecond: number;
}

@injectable()
export class FindInternalTx implements IListenerUseCase {
  constructor(
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.ContractRepository)
    private contractRepository: IContractRepository,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async listen() {
    this.eventBus.subscribe(EventChannel.NewBlock, this.onNewBlock.bind(this));
  }

  async onNewBlock(rawBlock: RawBlock) {
    const { data: contracts } = await this.contractRepository.findAll();

    const { fromBlock, toBlock, skip, requestsPerSecond } =
      this.getBlockFetchingRange(rawBlock);
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
      const msg: RawTxId = { blockchain: rawBlock.blockchain, hash, blockNumber: };
      this.eventBus.publish(EventChannel.SaveTx, msg);
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
    return events.map((event) => event.transactionHash).filter(onlyUniqueFilter);
  }

  private getBlockFetchingRange({
    block,
    blockchain,
  }: RawBlock): BlockFetchingConfig {
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
