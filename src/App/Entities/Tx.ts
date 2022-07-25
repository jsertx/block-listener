import { ethers } from "ethers";
import Joi from "joi";
import { Format } from "logform";
import { TransactionLog } from "../Models/TransactionLog";
import { validateOrThrowError } from "../Utils/Validation";
import { HexAddress } from "../Values/Address";
import { FormattedAmount } from "../Values/Amount";
import {
  Blockchain,
  BlockchainId,
  blockchainIdList,
} from "../Values/Blockchain";
import { TxType, txTypeList } from "../Values/Tx";
import { Entity } from "./Base/Entity";
import { Token } from "./Token";

export interface RawTx {
  hash: string;
  blockHeight: number;
  timestamp: number;
  data: string;
  to: string;
  from: string;
  value: string;
  logs: TransactionLog[];
  smartContractCall?: {
    method: string;
    signature: string;
    args: Record<string, any>;
  };
  original: ethers.providers.TransactionResponse;
}
export interface TxProps<TxDataType = any> {
  blockchain: BlockchainId;
  hash: string;
  type: TxType;
  raw: RawTx;
  data?: TxDataType;
}

export interface EthNativeTransferData {
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

const TxSchema = Joi.object({
  blockchain: Joi.valid(...blockchainIdList).required(),
  hash: Joi.string().required(),
  raw: Joi.any(),
  type: Joi.string().valid(...txTypeList),
});

export class Tx<DataTypeRaw> extends Entity<TxProps<DataTypeRaw>> {
  protected _blockchain: Blockchain;
  constructor(props: TxProps<DataTypeRaw>, _id?: string) {
    super(props, _id);
    this._blockchain = new Blockchain(props.blockchain);
  }
  get hash(): string {
    return this.props.hash;
  }

  get timestamp(): number {
    return this.props.raw.timestamp;
  }

  get block(): number {
    return this.props.raw.blockHeight;
  }

  get isSmartContractCall(): boolean {
    return !!this.raw.smartContractCall;
  }

  get blockchain(): Blockchain {
    return this._blockchain;
  }

  get type(): TxType {
    return this.props.type;
  }

  get raw(): RawTx {
    return this.props.raw;
  }
  get data(): DataTypeRaw | undefined {
    return this.props.data;
  }
  get original(): ethers.providers.TransactionResponse {
    return this.props.raw.original;
  }

  setTypeAndData(type: TxType, data: DataTypeRaw) {
    this.props.type = type;
    this.props.data = data;
  }

  static create(props: TxProps, _id?: string): Tx<any> {
    validateOrThrowError(props, TxSchema);
    return new Tx(props, _id);
  }
}

export interface EthNativeTransferTxRaw
  extends TxProps<EthNativeTransferData> {}
export class EthNativeTransferTx extends Tx<EthNativeTransferData> {}

export interface TokenTransferTxRaw extends TxProps<TokenTransferData> {}
export class TokenTransferTx extends Tx<TokenTransferData> {}

export interface DexSwapTransferTxRaw extends TxProps<DexSwapData> {}
export class DexSwapTransferTx extends Tx<DexSwapData> {}
