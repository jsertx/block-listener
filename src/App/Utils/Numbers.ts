import BigNumber from "bignumber.js";

export const toHex = (num: string | number) =>
	"0x" + new BigNumber(num).toString(16);
