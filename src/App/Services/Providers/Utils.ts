import { ethers } from "ethers";
import { ILogger } from "../../../Interfaces/ILogger";
import { v4 } from "uuid";
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
	_provider: JsonRpcProvider
): JsonRpcProvider =>
	new Proxy(_provider, {
		get: (target: JsonRpcProvider, key: keyof JsonRpcProvider) => {
			if (typeof target[key] === "function") {
				return (...args: any[]) => {
					const requestId = v4();
					logger.log({
						type: "provider.call.started",
						context: {
							rpcCall: { method: key, args, requestId }
						}
					});
					const call = (target[key] as any)(...args);
					if (call instanceof Promise) {
						return call
							.then((res) => {
								logger.log({
									type: "provider.call.success",
									context: {
										rpcCall: {
											method: key,
											args,
											requestId
										}
									}
								});
								return res;
							})
							.catch((error: any) => {
								logger.log({
									type: "provider.call.failed",
									context: {
										rpcCall: {
											method: key,
											args,
											requestId
										}
									}
								});
								throw new ProviderError(key, args, error);
							});
					}
					return call;
				};
			}
			return target[key];
		}
	});
