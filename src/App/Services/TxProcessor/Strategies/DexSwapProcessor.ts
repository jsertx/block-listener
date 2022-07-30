import { inject, injectable } from "inversify";
import { ILogger } from "../../../../Interfaces/ILogger";
import { IocKey } from "../../../../Ioc/IocKey";
import { DexSwapData, Tx } from "../../../Entities/Tx";
import { TxType } from "../../../Values/Tx";
import { ITxProcessStrategy } from "../ITxProcessStrategy";
import { Token } from "../../../Entities/Token";
import { IContractRepository } from "../../../Repository/IContractRepository";
import { UniswapV2RouterSwapMethods } from "../../../Types/UniswapV2RouterSwapMethods";
import { isSameAddress } from "../../../Utils/Address";
import { TransactionLog } from "../../../Types/TransactionLog";
import { IPriceService } from "../../../Interfaces/IPriceService";
import { BigNumber } from "bignumber.js";
import { IConfig } from "../../../../Interfaces/IConfig";
import { IBroker } from "../../../../Interfaces/IBroker";
import { HexAddressStr } from "../../../Values/Address";
import { checksumed } from "../../../Utils/Address";
import { onlyUniqueFilter } from "../../../Utils/Array";
import { WhaleDiscoveredMsg } from "../../../PubSub/Messages/WhaleDiscoveredMsg";
import { TokenDiscoveredMsg } from "../../../PubSub/Messages/TokenDiscoveredMsg";

const transferSignature = "Transfer(address,address,uint256)";
const swapSignature = "Swap(address,uint256,uint256,uint256,uint256,address)";

@injectable()
export class DexSwapProcessor implements ITxProcessStrategy {
  constructor(
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.Broker) private broker: IBroker,
    @inject(IocKey.Config) private config: IConfig,
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

    if (
      new BigNumber(dexSwapData.usdValue).gte(
        this.config.txRules.minDexSwapValueInUsd
      )
    ) {
      tx.setTypeAndData(TxType.DexSwap, dexSwapData);
      this.emitMessages(tx, dexSwapData);
      return tx;
    }
  }
  private emitMessages(tx: Tx<any>, dexSwapData: DexSwapData) {
    [dexSwapData.input.token, dexSwapData.output.token].forEach((address) => {
      this.broker.publish(
        new TokenDiscoveredMsg(tx.blockchain.id, {
          blockchain: tx.blockchain.id,
          address,
        })
      );
    });

    [dexSwapData.from, dexSwapData.to]
      .filter(onlyUniqueFilter)
      .forEach((address) => {
        this.broker.publish(
          new WhaleDiscoveredMsg(tx.blockchain.id, {
            blockchain: tx.blockchain.id,
            address,
          })
        );
      });
  }

  async getDexSwapData(tx: Tx<any>): Promise<DexSwapData> {
    const { method, args } = tx.raw.smartContractCall!;
    const path = args.path.split(",");
    const outDest = args.to;
    const from = tx.from;
    let inputToken: HexAddressStr = path[0];
    let outToken: HexAddressStr = path[path.length - 1];
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
      from: checksumed(from),
      to: checksumed(outDest),
      input: { amount: inputAmount, token: checksumed(inputToken) },
      output: { amount: outAmount, token: checksumed(outToken) },
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
