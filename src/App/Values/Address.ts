import { ethers } from "ethers";

export type HexAddressStr = string;
export class HexAddress {
  constructor(private value: HexAddressStr) {}

  get address() {
    return ethers.utils.getAddress(this.value);
  }

  equals(address: HexAddress | HexAddressStr): boolean {
    if (address instanceof HexAddress) {
      return this.equals(address.address);
    }
    return this.value === address;
  }
}
