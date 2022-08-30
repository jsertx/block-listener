import BigNumber from "bignumber.js";
import { ethers } from "ethers";

export const toHex = (num: string | number) =>
	"0x" + new BigNumber(num).toString(16);

export const truncateNumberBy = (minutes: number, factor: number) => {
	const multiplier = Math.floor(minutes / factor);
	return multiplier * factor;
};

export const BN = (
	value: BigNumber.Value | ethers.BigNumber,
	base?: number
) => {
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		value instanceof BigNumber
	) {
		return new BigNumber(value, base);
	}
	// for serialized ethers.BigNumber
	const anyValue = value as any;
	if (anyValue.type === "BigNumber") {
		return new BigNumber(anyValue.hex);
	}

	if (value instanceof ethers.BigNumber) {
		return new BigNumber(value.toString());
	}
	throw new Error("Invalid value");
};
