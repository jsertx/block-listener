import { WalletTag } from "../Values/WalletTag";
import { WalletType } from "../Values/WalletType";
import { Address, AddressRaw } from "./Address";

interface WalletAddressDataRaw {
  type: WalletType;
  tags: WalletTag[];
}

export interface WalletAddressRaw extends AddressRaw<WalletAddressDataRaw> {}

export class WalletAddress extends Address<WalletAddressDataRaw> {}
