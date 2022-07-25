import { inject, injectable } from "inversify";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { EventChannel } from "../Enums/Channel";
import { IBroker } from "../../Interfaces/IBroker";
import { IListenerUseCase } from "../Interfaces/IListenerUseCase";
import {
  EthNativeTransferData,
  EthNativeTransferTxRaw,
  Tx,
} from "../Entities/Tx";
import { LogDecoder, TxDecoder } from "@maticnetwork/eth-decoder";
import { ethers } from "ethers";
import { TransactionLog } from "../Models/TransactionLog";
import { ITxRepository } from "../Repository/ITxRepository";
import { TxType } from "../Values/Tx";
import { toFormatted, toPrecision } from "../Utils/Amount";

@injectable()
export class ProcessTx implements IListenerUseCase {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository,
    @inject(IocKey.EventBus)
    private eventBus: IBroker,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async listen() {
    this.eventBus.subscribe(EventChannel.ProcessTx, this.onNewTx.bind(this));
  }

  async onNewTx(tx: Tx<any>) {
    if (!tx.isSmartContractCall) {
      const data: EthNativeTransferData = {
        from: tx.raw.from,
        to: tx.raw.to,
        value: toFormatted(tx.raw.value),
      };
      tx.setTypeAndData(TxType.EthTransfer, data);
      await this.txRepository.save(tx);
    }
    this.logger.log({
      type: "process-tx.done",
      context: { txHash: tx.hash },
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
