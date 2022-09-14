import { Token } from "../Entities/Token";
import { isSameAddress } from "./Address";

export const uniqueTokenList = (token: Token, i: number, list: Token[]) => {
	return !list.some((inList) => isSameAddress(inList.address, token.address));
};
