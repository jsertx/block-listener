import { inject, injectable } from "inversify";
import { IocKey } from "../../../../Ioc/IocKey";
import {
	DexSwapData,
	DexSwapTx,
	TokenTransferData,
	TokenTransferTx,
	Tx
} from "../../../Entities/Tx";
import { TxType } from "../../../Values/TxType";
import { ITxProcessStrategy } from "../ITxProcessStrategy";
import { ERC20TransferMethods } from "../../SmartContract/SmartContractMethods";
import { IPriceService } from "../../../Interfaces/IPriceService";
import { ILogger } from "../../../../Interfaces/ILogger";
import { toFormatted } from "../../../Utils/Amount";
import { ITokenService } from "../../../Interfaces/ITokenService";

@injectable()
export class TokenTransferProcessor implements ITxProcessStrategy {
	constructor(
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.TokenService) private tokenService: ITokenService,
		@inject(IocKey.PriceService) private priceService: IPriceService
	) {}

	private shouldProcess(tx: Tx<any>): boolean {
		if (!tx.raw.smartContractCall) {
			return false;
		}
		const validMethods = Object.values(ERC20TransferMethods) as string[];
		const scCall = tx.raw.smartContractCall;
		return validMethods.includes(scCall.method);
	}

	async process(tx: Tx<any>) {
		if (!this.shouldProcess(tx)) {
			return;
		}

		const tokenTransferData = await this.getTokenTransferData(tx);
		if (!tokenTransferData) {
			return;
		}
		tx.setTypeAndData(TxType.DexSwap, tokenTransferData);
		return tx;
	}

	async getTokenTransferData(
		tx: TokenTransferTx
	): Promise<TokenTransferData | undefined> {
		const { method, args } = tx.smartContractCall;
		let from = tx.from;
		let to = args[0];
		let amount = args[1];
		if (method === ERC20TransferMethods.transferFrom) {
			from = args[0];
			to = args[1];
			amount = args[2];
		}
		const [token] = await this.tokenService.fetchTokensData(
			tx.blockchain.id,
			[tx.raw.to]
		);
		const usdValue = "0";
		const nativeValue = "0";
		const details: TokenTransferData = {
			nativeValue,
			usdValue,
			from,
			to,
			amount: toFormatted(amount, token.decimals),
			token: {
				symbol: token.symbol,
				address: token.address
			}
		};

		return details;
	}
}
