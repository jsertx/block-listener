import { WalletTag } from "../Values/WalletTag";
import { WalletType } from "../Values/WalletType";
import { Address, AddressRaw } from "./Base/Address";

interface WalletDataRaw {
  type: WalletType;
  tags: WalletTag[];
}

export interface WalletRaw extends AddressRaw<WalletDataRaw> {}

export class Wallet extends Address<WalletDataRaw> {
  static create(props: WalletRaw, _id?: string): Wallet {
    return new Wallet(props, _id);
  }
}
