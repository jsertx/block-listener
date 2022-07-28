import { HexAddressStr } from "../Values/Address";
import { Blockchain } from "../Values/Blockchain";

export interface RawTokenId {
  blockchain: Blockchain;
  address: HexAddressStr;
}
