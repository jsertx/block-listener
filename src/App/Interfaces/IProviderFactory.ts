import { Multicall, ContractCallResults } from "ethereum-multicall";
import { ethers } from "ethers";
import { Blockchain, BlockchainId } from "../Values/Blockchain";

export interface MulticallOptions {
	tryAggregate?: boolean;
}

export interface IProviderFactory {
	getMulticallProvider(
		blockchain: Blockchain | BlockchainId,
		opts?: MulticallOptions
	): Promise<Multicall>;
	getProvider(
		blockchain: Blockchain | BlockchainId
	): Promise<ethers.providers.JsonRpcProvider>;
}

export const multicallResultHelper = ({ results }: ContractCallResults) => {
	return function (
		contractReference: string,
		methodReferences: string[]
	): any[] {
		return results[contractReference].callsReturnContext.reduce(
			(result, callReturn) => {
				methodReferences.includes(callReturn.reference);
				const idx = methodReferences.indexOf(callReturn.reference);
				if (idx < 0) {
					return result;
				}

				const newRes = [...result];
				newRes[idx] =
					callReturn.returnValues.length === 1
						? callReturn.returnValues[0]
						: callReturn.returnValues;

				return newRes;
			},
			methodReferences.map((t) => undefined)
		);
	};
};
