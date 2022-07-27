import { inject, injectable } from "inversify";
import { ILogger } from "../../../../Interfaces/ILogger";
import { IocKey } from "../../../../Ioc/IocKey";
import { EventChannel } from "../../../Enums/Channel";
import { IBroker } from "../../../../Interfaces/IBroker";
import { IStandaloneApps } from "../../../Interfaces/IStandaloneApps";
import { EthNativeTransferData, Tx } from "../../../Entities/Tx";
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

interface SwapDetails {
  input: {
    token: string | "native";
    amount: string;
  };
  output: {
    token: string | "native";
    amount: string;
  };
}
@injectable()
export class DexSwapProcessor implements ITxProcessStrategy {
  constructor(
    @inject(IocKey.Logger) private logger: ILogger,
    @inject(IocKey.TokenRepository) private tokenRepository: ITokenRepository,
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

    const swapDetails = getSwapDetails(tx, router);
    tx.setTypeAndData(TxType.DexSwap, swapDetails);
    return tx;
  }
}

function getSwapDetails(tx: Tx<any>, router: Contract): SwapDetails {
  const { method, args } = tx.raw.smartContractCall!;
  const path = args.path.split(",");
  const outDest = args.to;
  const from = tx.from;
  let inputToken = path[0];
  let outToken = path[path.length - 1];
  let outAmount: string | undefined;
  let inputAmount: string | undefined;

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

  if (!inputAmount || !outAmount) {
    throw new Error("Could not get swapdetails");
  }

  const details: SwapDetails = {
    input: { amount: inputAmount, token: inputToken },
    output: { amount: outAmount, token: outToken },
  };

  return details;
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
      log.signature === "Transfer(address,address,uint256)"
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
      log.signature === "Transfer(address,address,uint256)"
  );
  if (!transferLog) {
    return;
  }
  return transferLog.args.value;
}
