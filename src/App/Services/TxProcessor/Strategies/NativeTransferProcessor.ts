import { injectable } from "inversify";
import { EthTransferData, Tx } from "../../../Entities/Tx";
import { TxType } from "../../../Values/TxType";
import { toFormatted } from "../../../Utils/Amount";
import { ITxProcessStrategy } from "../ITxProcessStrategy";

@injectable()
export class NativeTransferProcessor implements ITxProcessStrategy {
	async process(tx: Tx<any>) {
		if (tx.isSmartContractCall) {
			return;
		}
		const data: EthTransferData = {
			from: tx.raw.from,
			to: tx.raw.to,
			value: toFormatted(tx.raw.value)
		};
		tx.setTypeAndData(TxType.EthTransfer, data);

		return tx;
	}
}
