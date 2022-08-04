import { inject, injectable } from "inversify";
import { IocKey } from "../../../../Ioc/IocKey";
import { DexSwapData, DexSwapTx, Tx } from "../../../Entities/Tx";
import { TxType } from "../../../Values/TxType";
import { ITxProcessStrategy } from "../ITxProcessStrategy";
import { Token } from "../../../Entities/Token";
import { IContractRepository } from "../../../Repository/IContractRepository";
import { UniswapV2RouterSwapMethods } from "../../../Types/UniswapV2RouterSwapMethods";
import { isSameAddress } from "../../../Utils/Address";
import { TransactionLog } from "../../../Types/TransactionLog";
import { IPriceService } from "../../../Interfaces/IPriceService";
import { HexAddressStr } from "../../../Values/Address";
import { ILogger } from "../../../../Interfaces/ILogger";
import {
	IProviderFactory,
	multicallResultHelper
} from "../../../Interfaces/IProviderFactory";
import { Blockchain } from "../../../Values/Blockchain";
import { ERC20 } from "../../SmartContract/ABI/ERC20";
import { toFormatted } from "../../../Utils/Amount";

const transferSignature = "Transfer(address,address,uint256)";
const swapSignature = "Swap(address,uint256,uint256,uint256,uint256,address)";

interface TokenData {
	symbol: string;
	decimals: number;
}
@injectable()
export class DexSwapProcessor implements ITxProcessStrategy {
	constructor(
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.PriceService) private priceService: IPriceService,
		@inject(IocKey.ProviderFactory)
		private providerFactory: IProviderFactory,
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository
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

		const router = await this.contractRepository.findContract(
			tx.raw.to,
			tx.blockchain.id
		);
		if (!router) {
			// maybe just set dex to unknown
			this.logger.warn({
				type: "dex-swap-processor.router-not-found",
				message: "Router not found",
				context: {
					blockchain: tx.blockchain.id,
					hash: tx.hash
				}
			});
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
		const weth = tx.blockchain.wrappedToken;
		const nativeValue = getNativeValueFromLogs(weth, tx.raw.logs);

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

		if (!inputAmount || !outAmount || !nativeValue) {
			this.logger.warn({
				type: "tx.dex-swap.process.cannot-get-value",
				message:
					"Swap Input/Output or native value could not be calculated"
			});
			return;
		}

		const [usdValue, [inputTokenData, outputTokenData]] = await Promise.all(
			[
				this.priceService.getBlockchainNativeTokenUsdValue(
					tx.blockchain,
					weth.toFormatted(nativeValue)
				),
				this.getTokensData(tx.blockchain, inputToken, outToken)
			]
		);

		const details: DexSwapData = {
			nativeValue: weth.toFormatted(nativeValue),
			usdValue: usdValue.toFixed(),
			from,
			to: outDest,
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

	private async getTokensData(
		blockchain: Blockchain,
		inputToken: string,
		outputToken: string
	): Promise<[TokenData, TokenData]> {
		const multicall = this.providerFactory.getMulticallProvider(blockchain);
		const select = await multicall
			.call(
				[inputToken, outputToken].map((address) => ({
					abi: ERC20,
					reference: address,
					contractAddress: address,
					calls: [
						{
							methodName: "symbol",
							reference: "symbol",
							methodParameters: []
						},
						{
							methodName: "decimals",
							reference: "decimals",
							methodParameters: []
						}
					]
				}))
			)
			.then(multicallResultHelper);

		const [symbolA, decimalsA] = select(inputToken, ["symbol", "decimals"]);
		const [symbolB, decimalsB] = select(outputToken, [
			"symbol",
			"decimals"
		]);
		return [
			{ symbol: symbolA, decimals: decimalsA },
			{ symbol: symbolB, decimals: decimalsB }
		];
	}
}

function getNativeValueFromLogs(
	wethToken: Token,
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
				isSameAddress(log.address, wethToken.address) &&
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
