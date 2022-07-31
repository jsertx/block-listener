import { inject, injectable } from "inversify";
import { ILogger } from "../../../../Interfaces/ILogger";
import { IocKey } from "../../../../Ioc/IocKey";
import { Publication } from "../../../../Infrastructure/Broker/Publication";
import { IBroker } from "../../../../Interfaces/IBroker";
import { IStandaloneApps } from "../../../Interfaces/IStandaloneApps";
import { EthTransferData, Tx } from "../../../Entities/Tx";
import { TxType } from "../../../Values/TxType";
import { toFormatted } from "../../../Utils/Amount";
import { ITxProcessStrategy } from "../ITxProcessStrategy";

@injectable()
export class NativeTransferProcessor implements ITxProcessStrategy {
  constructor(@inject(IocKey.Logger) private logger: ILogger) {}

  async process(tx: Tx<any>) {
    if (tx.isSmartContractCall) {
      return;
    }
    const data: EthTransferData = {
      from: tx.raw.from,
      to: tx.raw.to,
      value: toFormatted(tx.raw.value),
    };
    tx.setTypeAndData(TxType.EthTransfer, data);

    return tx;
  }
}
