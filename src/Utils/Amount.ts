import { ethers } from "ethers";

export const toPrecision = (num: ethers.BigNumberish, decimals = 18) =>
  ethers.utils.parseUnits(`${num}`, decimals);

export const toFormatted = (num: ethers.BigNumberish, decimals = 18) =>
  ethers.utils.formatUnits(`${num}`, decimals);
