import { ethers } from "ethers";
import { HexAddress } from "../Values/Address";
import { FormattedAmount } from "../Values/Amount";
import { Blockchain } from "../Values/Blockchain";
import { TxType } from "../Values/Tx";

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

export interface EthNativeTransferTx extends Tx<EthNativeTransferData> {}
