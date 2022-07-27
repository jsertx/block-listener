import { inject, injectable } from "inversify";
import { ILogger } from "../../../../Interfaces/ILogger";
import { IocKey } from "../../../../Ioc/IocKey";
import { EventChannel } from "../../../Enums/Channel";
import { IBroker } from "../../../../Interfaces/IBroker";
import { IStandaloneApps } from "../../../Interfaces/IStandaloneApps";
import { DexSwapData, EthNativeTransferData, Tx } from "../../../Entities/Tx";
import { ITxRepository } from "../../../Repository/ITxRepository";
import { TxType } from "../../../Values/Tx";
import { toFormatted } from "../../../Utils/Amount";
import { ITxProcessStrategy } from "../ITxProcessStrategy";
import { ITokenRepository } from "../../../Repository/ITokenRepository";
import { Token } from "../../../Entities/Token";
import { IContractRepository } from "../../../Repository/IContractRepository";
import { ContractType } from "../../../Values/ContractType";
import { UniswapV2RouterSwapMethods } from "../../../Types/UniswapV2RouterSwapMethods";
import { Contract } from "../../../Entities/Contract";
import { isSameAddress } from "../../../Utils/Address";
import { TransactionLog } from "../../../Types/TransactionLog";
import { IPriceService } from "../../../Interfaces/IPriceService";

const transferSignature = "Transfer(address,address,uint256)";
const swapSignature = "Swap(address,uint256,uint256,uint256,uint256,address)";

@injectable()
export class DexSwapProcessor implements ITxProcessStrategy {
  constructor(
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.TokenRepository) private tokenRepository: ITokenRepository,
    @inject(IocKey.PriceService) private priceService: IPriceService,
    @inject(IocKey.ContractRepository)
    private contractRepository: IContractRepository
  ) {}

  private async shouldProcess(tx: Tx<any>): Promise<boolean> {
    if (!tx.raw.smartContractCall) {
      return false;
    }
    const validMethods = Object.values(UniswapV2RouterSwapMethods) as string[];
    const scCall = tx.raw.smartContractCall;
    return validMethods.includes(scCall.method);
  }

  async process(tx: Tx<any>) {
    if (!(await this.shouldProcess(tx))) {
      return;
    }

    const router = await this.contractRepository.findContract(
      tx.raw.to,
      tx.blockchain.id
    );
    if (!router) {
      // maybe just set dex to unknown
      throw new Error("Contract not found for this swap tx");
    }

    const dexSwapData = await this.getDexSwapData(tx);
    tx.setTypeAndData(TxType.DexSwap, dexSwapData);
    return tx;
  }

  async getDexSwapData(tx: Tx<any>): Promise<DexSwapData> {
    const { method, args } = tx.raw.smartContractCall!;
    const path = args.path.split(",");
    const outDest = args.to;
    const from = tx.from;
    let inputToken = path[0];
    let outToken = path[path.length - 1];
    let outAmount: string | undefined;
    let inputAmount: string | undefined;
    const weth = tx.blockchain.wrappedToken!;
    const nativeValue = getNativeValueFromLogs(weth, tx.raw.logs);

    switch (method) {
      case UniswapV2RouterSwapMethods.swapETHForExactTokens:
        inputAmount = tx.raw.value;

        outAmount =
          getOutputTokenTransferAmount(tx, outToken, outDest) || args.amountOut;
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
          getInputTokenTransferAmount(tx, inputToken, from) || args.amountInMax;
        outAmount = args.amountOut;
        break;
    }

    if (!inputAmount || !outAmount || !nativeValue) {
      throw new Error("Could not get swapdetails");
    }

    const usdValue = await this.priceService.getBlockchainNativeTokenUsdValue(
      tx.blockchain,
      weth.toFormatted(nativeValue)
    );
    const details: DexSwapData = {
      nativeValue: weth.toFormatted(nativeValue),
      usdValue: usdValue.toFixed(),
      input: { amount: inputAmount, token: inputToken },
      output: { amount: outAmount, token: outToken },
    };

    return details;
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
  tx: Tx,
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
  tx: Tx,
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
