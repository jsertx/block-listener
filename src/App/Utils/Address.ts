import { ethers } from "ethers";

export const checksumed = (address: string): string =>
  ethers.utils.getAddress(address.toLowerCase());

export const isSameAddress = (address1: string, address2: string) =>
  address1 &&
  address2 &&
  checksumed(address1.toLowerCase()) === checksumed(address2.toLowerCase());

export const isAddreddIn = (address1: string, addresses: string[]) =>
  addresses.some((address) => isSameAddress(address, address1));

export const createAddrMap = <T>(
  initialValue: Record<string, T> = {}
): Record<string, T> => {
  const initialValuePrepared: Record<string, T> = {};
  Object.entries(initialValue).forEach(([addr, value]) => {
    initialValuePrepared[checksumed(addr)] = value;
  });

  const prepareProp = (prop: string) =>
    prop.startsWith("0x") ? checksumed(prop) : prop;

  return new Proxy(initialValuePrepared, {
    get: (target: Record<string, T>, prop: string) => {
      return target[prepareProp(prop)];
    },
    set: (target: Record<string, T>, prop: string, value) => {
      target[prepareProp(prop)] = value;
      return true;
    },
  });
};

export const ZERO_ADDRESS = ethers.constants.AddressZero;
