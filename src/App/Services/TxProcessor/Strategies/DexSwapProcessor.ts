import { inject, injectable } from "inversify";
import { IocKey } from "../../../../Ioc/IocKey";
import { DexSwapData, DexSwapTx, Tx } from "../../../Entities/Tx";
import { TxType } from "../../../Values/TxType";
import { ITxProcessStrategy } from "../ITxProcessStrategy";
import { Token } from "../../../Entities/Token";
import { UniswapV2RouterSwapMethods } from "../../SmartContract/SmartContractMethods";
import { isSameAddress } from "../../../Utils/Address";
import { TransactionLog } from "../../../Types/TransactionLog";
import { IPriceService } from "../../../Interfaces/IPriceService";
import { HexAddressStr } from "../../../Values/Address";
import { ILogger } from "../../../../Interfaces/ILogger";
import { toFormatted } from "../../../Utils/Amount";
import { BN } from "../../../Utils/Numbers";
import { ITokenService } from "../../../Interfaces/ITokenService";

const transferSignature = "Transfer(address,address,uint256)";
const swapSignature = "Swap(address,uint256,uint256,uint256,uint256,address)";

@injectable()
export class DexSwapProcessor implements ITxProcessStrategy {
	constructor(
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.TokenService) private tokenService: ITokenService,
		@inject(IocKey.PriceService) private priceService: IPriceService
	) {}

	private shouldProcess(tx: Tx<any>): boolean {
		if (!tx.raw.smartContractCall) {
			return false;
		}
		const validMethods = Object.values(
			UniswapV2RouterSwapMethods
		) as string[];
		const scCall = tx.raw.smartContractCall;
		return validMethods.includes(scCall.method);
	}

	async process(tx: Tx<any>) {
		if (!this.shouldProcess(tx)) {
			return;
		}

		const dexSwapData = await this.getDexSwapData(tx);
		if (!dexSwapData) {
			return;
		}
		tx.setTypeAndData(TxType.DexSwap, dexSwapData);
		return tx;
	}

	async getDexSwapData(tx: DexSwapTx): Promise<DexSwapData | undefined> {
		const { method, args } = tx.smartContractCall;
		const path = args.path.split(",");
		const outDest = args.to;
		const from = tx.from;
		const inputToken: HexAddressStr = path[0];
		const outToken: HexAddressStr = path[path.length - 1];
		let outAmount: string | undefined;
		let inputAmount: string | undefined;
		const weth = await this.tokenService.getWrappedToken(tx.blockchain.id);
		const stables = await this.tokenService.getStableCoins(
			tx.blockchain.id
		);
		let nativeValue = getTokenValueFromLogs(weth, tx.raw.logs);
		let usdValue = getStableUsdValueFromLogs(stables, tx.raw.logs);
		const calculatedNativeValue = !nativeValue;
		const calculatedUsdValue = !usdValue;
		switch (method) {
			case UniswapV2RouterSwapMethods.swapETHForExactTokens:
				inputAmount = tx.raw.value;
				outAmount =
					getOutputTokenTransferAmount(tx, outToken, outDest) ||
					args.amountOut;
				break;
			case UniswapV2RouterSwapMethods.swapExactETHForTokens:
			case UniswapV2RouterSwapMethods.swapExactETHForTokensSupportingFeeOnTransferTokens:
				inputAmount = tx.raw.value;
				outAmount =
					getOutputTokenTransferAmount(tx, outToken, outDest) ||
					args.amountOutMin;
				break;
			case UniswapV2RouterSwapMethods.swapExactTokensForETH:
			case UniswapV2RouterSwapMethods.swapExactTokensForETHSupportingFeeOnTransferTokens:
				inputAmount = args.amountIn;
				outAmount =
					getOutputTokenTransferAmount(tx, outToken, outDest) ||
					args.amountOutMin;

				break;
			case UniswapV2RouterSwapMethods.swapExactTokensForTokens:
			case UniswapV2RouterSwapMethods.swapExactTokensForTokensSupportingFeeOnTransferTokens:
				inputAmount = args.amountIn;
				outAmount =
					getOutputTokenTransferAmount(tx, outToken, outDest) ||
					args.amountOutMin;
				break;
			case UniswapV2RouterSwapMethods.swapTokensForExactTokens:
				inputAmount =
					getInputTokenTransferAmount(tx, inputToken, from) ||
					args.amountInMax;
				outAmount = args.amountOut;
				break;
		}

		if (!inputAmount || !outAmount || !(nativeValue || usdValue)) {
			this.logger.warn({
				type: "tx.dex-swap.process.cannot-get-value",
				message:
					"Swap Input/Output or native value could not be calculated",
				context: {
					blockchain: tx.blockchain.id,
					txHash: tx.hash
				}
			});
			return;
		}

		if (!usdValue && nativeValue) {
			usdValue = await this.priceService
				.getBlockchainNativeTokenUsdValue(
					tx.blockchain,
					weth.toFormatted(nativeValue),
					tx.raw.timestamp
				)
				.then((res) => res.toFixed());
		} else if (!nativeValue && usdValue) {
			const nativePrice =
				await this.priceService.getBlockchainNativeTokenUsdPrice(
					tx.blockchain,
					tx.raw.timestamp
				);
			nativeValue = BN(usdValue).dividedBy(nativePrice).toFixed();
		}

		const [inputTokenData, outputTokenData] =
			await this.tokenService.fetchTokensData(tx.blockchain.id, [
				inputToken,
				outToken
			]);
		if (!nativeValue || !usdValue) {
			return;
		}

		const details: DexSwapData = {
			nativeValue: weth.toFormatted(nativeValue),
			usdValue,
			from,
			to: outDest,
			calculatedNativeValue: calculatedNativeValue,
			calculatedUsdValue: calculatedUsdValue,
			input: {
				symbol: inputTokenData.symbol,
				amount: toFormatted(inputAmount, inputTokenData.decimals),
				token: inputToken
			},
			output: {
				symbol: outputTokenData.symbol,
				amount: toFormatted(outAmount, outputTokenData.decimals),
				token: outToken
			}
		};

		return details;
	}
}

function getTokenValueFromLogs(
	token: Token,
	logs: TransactionLog[]
): string | undefined {
	// 1) Find Swap Logs
	for (const swapLog of logs) {
		if (swapLog.signature !== swapSignature) {
			continue;
		}
		// 2) Find incoming or outgoing transfer of WETH to/from this pair address
		for (const log of logs) {
			if (
				isSameAddress(log.address, token.address) &&
				log.signature === transferSignature &&
				(isSameAddress(log.args.to, swapLog.address) ||
					isSameAddress(log.args.from, swapLog.address))
			) {
				// 3) If found, we have the native value of this TX
				return log.args.value;
			}
		}
	}
}
function getOutputTokenTransferAmount(
	tx: DexSwapTx,
	outputAddr: string,
	destAddr: string
): string | undefined {
	const transferLog = tx.raw.logs.find((log) => {
		return (
			isSameAddress(log.address, outputAddr) &&
			isSameAddress(log.args.to, destAddr) &&
			log.signature === transferSignature
		);
	});
	if (!transferLog) {
		return;
	}
	return transferLog.args.value;
}

function getInputTokenTransferAmount(
	tx: DexSwapTx,
	tokenAddress: string,
	fromAddr: string
): string | undefined {
	const transferLog = tx.raw.logs.find(
		(log) =>
			isSameAddress(log.address, tokenAddress) &&
			isSameAddress(log.args.from, fromAddr) &&
			log.signature === transferSignature
	);
	if (!transferLog) {
		return;
	}
	return transferLog.args.value;
}

function getStableUsdValueFromLogs(stables: Token[], logs: TransactionLog[]) {
	if (stables.length === 0) {
		return undefined;
	}
	for (const stable of stables) {
		const value = getTokenValueFromLogs(stable, logs);
		if (value) {
			return stable.toFormatted(value);
		}
	}
}
