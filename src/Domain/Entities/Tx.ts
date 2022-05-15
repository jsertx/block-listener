import { ethers } from "ethers";
import { Format } from "logform";
import { HexAddress } from "../Values/Address";
import { FormattedAmount } from "../Values/Amount";
import { Blockchain } from "../Values/Blockchain";
import { TxType } from "../Values/Tx";
import { Token } from "./Token";

interface TxMetadata {
  /*
  Here we are going to store how and where it was gathered.
  and other useful information
  */
}

export interface UnprocessedTx {
  blockchain: Blockchain;
  metadata?: TxMetadata;
  raw: ethers.providers.TransactionResponse;
}

export interface Tx<TxDataType = any> extends UnprocessedTx {
  type: TxType;
  data: TxDataType;
}

interface EthNativeTransferData {
  from: HexAddress;
  to: HexAddress;
  value: FormattedAmount;
}

interface TokenTransferData {
  from: HexAddress;
  to: HexAddress;
  value: FormattedAmount;
  token: Token;
}

interface DexSwapData {
  inputToken: Token;
  inputAmount: FormattedAmount;
  outputToken: Token;
  outputAmount: Format;
}

export interface EthNativeTransferTx extends Tx<EthNativeTransferData> {}

export interface TokenTransferTx extends Tx<TokenTransferData> {}
export interface DexSwapTransferTx extends Tx<DexSwapData> {}
