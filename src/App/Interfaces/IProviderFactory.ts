import { Multicall, ContractCallResults } from "ethereum-multicall";
import { ethers } from "ethers";
import { Blockchain, BlockchainId } from "../Values/Blockchain";

export interface IProviderFactory {
	getMulticallProvider(blockchain?: Blockchain | BlockchainId): Multicall;
	getProvider(
		blockchain?: Blockchain | BlockchainId
	): ethers.providers.BaseProvider;
}

export const multicallResultHelper = ({ results }: ContractCallResults) => {
	return function (
		contractReference: string,
		methodReferences: string[]
	): any[] {
		return results[contractReference].callsReturnContext
			.filter((callReturn) =>
				methodReferences.includes(callReturn.reference)
			)
			.map((callReturn) => callReturn.returnValues[0]);
	};
};
