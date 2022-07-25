import { ethers } from "ethers";
import { Format } from "logform";
import { HexAddress } from "../Values/Address";
import { FormattedAmount } from "../Values/Amount";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { TxType } from "../Values/Tx";
import { Entity } from "./Base/Entity";
import { Token } from "./Token";

interface TxMetadata {
  /*
  Here we are going to store how and where it was gathered.
  and other useful information
  */
}

export interface TxRaw<TxDataType = any> {
  blockchain: BlockchainId;
  hash: string;
  metadata?: TxMetadata;
  raw: ethers.providers.TransactionResponse;
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
export class Tx<DataTypeRaw = any> extends Entity<TxRaw<DataTypeRaw>> {
  protected _blockchain: Blockchain;
  constructor(props: TxRaw<DataTypeRaw>, _id?: string) {
    super(props, _id);
    this._blockchain = new Blockchain(props.blockchain);
  }
  get blockchain(): Blockchain {
    return this._blockchain;
  }
  get type(): TxType {
    return this.props.type;
  }
}

export interface EthNativeTransferTxRaw extends TxRaw<EthNativeTransferData> {}
export class EthNativeTransferTx extends Tx<EthNativeTransferData> {}

export interface TokenTransferTxRaw extends TxRaw<TokenTransferData> {}
export class TokenTransferTx extends Tx<TokenTransferData> {}

export interface DexSwapTransferTxRaw extends TxRaw<DexSwapData> {}
export class DexSwapTransferTx extends Tx<DexSwapData> {}
