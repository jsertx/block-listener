import { inject, injectable } from "inversify";
import { ITxRepository } from "../Repository/ITxRepository";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { EventChannel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";
import { IProviderFactory } from "../Interfaces/IProviderFactory";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { RawTx, Tx } from "../Entities/Tx";
import { TxType } from "../Values/Tx";
import { RawTxId } from "../Types/RawTxId";
import { isSmartContractCall } from "../Utils/Tx";
import { IContractRepository } from "../Repository/IContractRepository";
import { LogDecoder, TxDecoder } from "@maticnetwork/eth-decoder";
import { ethers } from "ethers";
import { TransactionLog } from "../Types/TransactionLog";
import { allAbiList } from "../Services/SmartContract/ABI";

@injectable()
export class SaveTx implements IStandaloneApps {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.ContractRepository)
    private contractRepository: IContractRepository,
    @inject(IocKey.ProviderFactory) private providerFactory: IProviderFactory,
    @inject(IocKey.EventBus) private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async start() {
    this.eventBus.subscribe(EventChannel.SaveTx, this.onNewTx.bind(this));
  }

  async onNewTx({ blockchain, hash }: RawTxId) {
    const provider = this.providerFactory.getProvider(blockchain);

    const [res, receipt] = await Promise.all([
      provider.getTransaction(hash),
      provider.getTransactionReceipt(hash),
    ]);

    if (receipt.status === 0) {
      return;
    }

    const block = await provider.getBlock(res.blockNumber!);

    const logsDecoder = new LogDecoder(allAbiList);
    const logs: TransactionLog[] = this.decodeTxLogs(receipt, logsDecoder);

    let smartContractCall: RawTx["smartContractCall"];
    if (isSmartContractCall(res)) {
      const txDecoder = new TxDecoder(allAbiList);
      smartContractCall = this.decodeTxDetails(res, txDecoder);
    }

    const raw: RawTx = {
      original: res,
      hash,
      blockHeight: receipt.blockNumber,
      timestamp: block.timestamp,
      data: res.data,
      to: res.to || "WTF",
      from: res.from,
      value: res.value.toString(),
      smartContractCall,
      logs: logs,
    };

    const tx = await this.txRepository.save(
      Tx.create({ blockchain: blockchain.id, hash, raw, type: TxType.Unknown })
    );
    this.eventBus.publish(EventChannel.ProcessTx, tx);
    this.logger.log({
      type: "save-tx.saved",
      context: { txHash: hash },
    });
  }

  private decodeTxLogs(
    txReceipt: ethers.providers.TransactionReceipt,
    decoder: LogDecoder
  ): TransactionLog[] {
    const decodedLogs = decoder.decodeLogs(txReceipt.logs);
    return decodedLogs.map((rawLog: any) => {
      const log = rawLog;
      const args = log.eventFragment.inputs.reduce(
        (t: any, curr: any, i: number) => {
          const argName: string = curr.name;
          t[argName] = log.args[i].toString();
          return t;
        },
        {} as Record<string, any>
      );

      return {
        tx_hash: txReceipt.transactionHash,
        name: log.name,
        signature: log.signature,
        topic: log.topic,
        address: log.address,
        args,
      };
    });
  }

  private decodeTxDetails(
    txRes: ethers.providers.TransactionResponse,
    decoder: TxDecoder
  ) {
    try {
      const decodedTx = decoder.decodeTx(txRes);

      const args = decodedTx.functionFragment.inputs.reduce((t, curr, i) => {
        const argName: string = curr.name;
        t[argName] = decodedTx.args[i].toString();
        return t;
      }, {} as Record<string, any>);

      return {
        method: decodedTx.name,
        signature: decodedTx.signature,
        args,
      };
    } catch (error) {
      return {
        method: "unknown",
        signature: "external",
        args: {},
      };
    }
  }
}
