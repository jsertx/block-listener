import { ethers } from "ethers";

export const isSameAddress = (address1: string, address2: string) =>
  ethers.utils.getAddress(address1.toLowerCase()) ===
  ethers.utils.getAddress(address2.toLowerCase());

export const isAddreddIn = (address1: string, addresses: string[]) =>
  addresses.some((address) => isSameAddress(address, address1));
