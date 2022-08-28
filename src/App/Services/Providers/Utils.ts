import { ethers } from "ethers";

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
	_provider: JsonRpcProvider
): JsonRpcProvider =>
	new Proxy(_provider, {
		get: (target: JsonRpcProvider, key: keyof JsonRpcProvider) => {
			if (typeof target[key] === "function") {
				return (...args: any[]) =>
					(target[key] as any)(...args).catch((error: any) => {
						throw new ProviderError(key, args, error);
					});
			}
			return target[key];
		}
	});
