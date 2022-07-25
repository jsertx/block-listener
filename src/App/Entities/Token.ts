import { HexAddress } from "../Values/Address";
import { Blockchain } from "../Values/Blockchain";
import { Entity } from "./Base/Entity";

export interface TokenRaw {
  address: HexAddress;
  blockchain: Blockchain;
  symbol: string;
  name: string;
  decimals: number;
}

export class Token extends Entity<TokenRaw> {}
