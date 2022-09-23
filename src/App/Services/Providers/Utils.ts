import Bottleneck from "bottleneck";
import { ethers } from "ethers";
import { ILogger } from "../../../Interfaces/ILogger";

type JsonRpcProvider = ethers.providers.JsonRpcProvider;

export class ProviderError extends Error {
	constructor(
		public readonly method: string,
		public readonly args: any[],
		public readonly originalError: Error
	) {
		super(`[Provider#${method}] ${originalError.message}`);
	}
}

export const createWrappedProvider = (
	logger: ILogger,
	url: string,
	chainId: number,
	rateConfig: Bottleneck.ConstructorOptions
): { bottleneck: Bottleneck; provider: JsonRpcProvider } => {
	const _provider = new ethers.providers.StaticJsonRpcProvider(url, chainId);
	const bottleneck = new Bottleneck({ ...rateConfig, id: url });
	const provider = new Proxy(_provider, {
		get: (target: JsonRpcProvider, key: keyof JsonRpcProvider) => {
			if (key === "send") {
				return (method: string, params: any[]) => {
					return bottleneck
						.schedule(() => {
							return target.send(method, params);
						})
						.catch((error) => {
							logger.error({
								type: `provider.call.failed.${method}`,
								message: "Rpc call failed",
								context: {
									rpcCall: {
										method: key,
										params
									}
								}
							});
							throw new ProviderError(key, params, error);
						});
				};
			}
			return target[key];
		}
	});

	return { bottleneck, provider };
};
