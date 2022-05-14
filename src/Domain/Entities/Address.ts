import { HexAddress } from "../Values/Address";
import { Blockchain } from "../Values/Blockchain";

export enum ContractType {
  DexRouter = "dex_router",
  Token = "token",
}

export enum AddressType {
  Wallet = "wallet",
  Contract = "contract",
}

export enum Abi {
  Unknown = "unknown",
  UniswapRouterV2 = "uniswap_router_v2",
  ERC20 = "erc20",
}

export interface Address {
  blockchain: Blockchain;
  address: HexAddress;
  type: AddressType;
  contract?: {
    alias: string;
    type: ContractType;
    abi?: Abi;
  };
}
