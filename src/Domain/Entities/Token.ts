import { HexAddress } from "../Values/Address";

export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: HexAddress;
}
