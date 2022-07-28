import { HexAddressStr } from "../Values/Address";
import { Blockchain } from "../Values/Blockchain";

export interface RawWalletId {
  blockchain: Blockchain;
  address: HexAddressStr;
}
