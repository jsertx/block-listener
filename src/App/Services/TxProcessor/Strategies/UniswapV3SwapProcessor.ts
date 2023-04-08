import { injectable } from "inversify";
import { Tx } from "../../../Entities/Tx";
import { TxType } from "../../../Values/TxType";
import { ITxProcessStrategy } from "../ITxProcessStrategy";
import { UniswapV3RouterSwapMethods } from "../../SmartContract/SmartContractMethods";

@injectable()
export class UniswapV3SwapProcessor implements ITxProcessStrategy {
	private shouldProcess(tx: Tx<any>): boolean {
		if (!tx.raw.smartContractCall) {
			return false;
		}
		const validMethods = Object.values(
			UniswapV3RouterSwapMethods
		) as string[];
		const scCall = tx.raw.smartContractCall;
		return validMethods.includes(scCall.method);
	}

	async process(tx: Tx<any>) {
		if (!this.shouldProcess(tx)) {
			return;
		}

		tx.setTypeAndData(TxType.DexSwapUniswapV3, {});
		return tx;
	}
}
