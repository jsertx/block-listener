import BigNumber from "bignumber.js";

const factor = (decimals: number) => new BigNumber(10).pow(decimals).toString();

export const toPrecision = (hex: string, decimals = 18) =>
	new BigNumber(hex).multipliedBy(factor(decimals)).toString();

export const toFormatted = (hex: string, decimals = 18) =>
	new BigNumber(hex).div(factor(decimals)).toString();
