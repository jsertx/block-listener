import { inject, injectable } from "inversify";
import { EthTransferData, Tx } from "../../../Entities/Tx";
import { TxType } from "../../../Values/TxType";
import { toFormatted } from "../../../Utils/Amount";
import { ITxProcessStrategy } from "../ITxProcessStrategy";
import { IocKey } from "../../../../Ioc/IocKey";
import { IPriceService } from "../../../Interfaces/IPriceService";

@injectable()
export class NativeTransferProcessor implements ITxProcessStrategy {
	constructor(
		@inject(IocKey.PriceService) private priveService: IPriceService
	) {}
	async process(tx: Tx<any>) {
		if (tx.isSmartContractCall) {
			return;
		}
		const value = toFormatted(tx.raw.value);
		const usdValue =
			await this.priveService.getBlockchainNativeTokenUsdValue(
				tx.blockchain,
				value,
				tx.timestamp
			);

		const data: EthTransferData = {
			from: tx.raw.from,
			to: tx.raw.to,
			usdValue: usdValue.toString(),
			value
		};
		tx.setTypeAndData(TxType.EthTransfer, data);

		return tx;
	}
}
