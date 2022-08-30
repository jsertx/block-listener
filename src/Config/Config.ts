import { IConfig } from "../Interfaces/IConfig";
import { getEnv } from "../App/Utils/Env";
import { BlockchainId } from "./Blockchains";

export const Config: IConfig = {
	providers: prepareNodeList({
		[BlockchainId.Ethereum]: [],
		[BlockchainId.Binance]: [],
		[BlockchainId.Polygon]: []
	}),
	enabledBlockchains: [
		BlockchainId.Ethereum
		//BlockchainId.Polygon,
		//BlockchainId.Binance
	],
	database: {
		database: getEnv("DATABASE_NAME", "blocklistener"),
		connectionUri: getEnv("DATABASE_URI")
	},
	http: {
		port: getEnv("PORT", "80")
	},
	broker: {
		brokerUri: getEnv("BROKER_URI")
	},
	txRules: {
		[BlockchainId.Ethereum]: {
			minNativeTransferValueInUsd: `${100_000}`,
			minDexSwapValueInUsd: `${50_000}`
		},
		[BlockchainId.Binance]: {
			minNativeTransferValueInUsd: `NOT_NEEDED`,
			minDexSwapValueInUsd: `NOT_NEEDED`
		},
		[BlockchainId.Polygon]: {
			minNativeTransferValueInUsd: `NOT_NEEDED`,
			minDexSwapValueInUsd: `NOT_NEEDED`
		}
	},
	covalent: {
		apiKey: getEnv("COVALENT_API_KEY")
	},
	finnhub: {
		apiKey: getEnv("FINNHUB_API_KEY")
	}
};

function prepareNodeList(
	providers: IConfig["providers"]
): IConfig["providers"] {
	Object.entries(providers).forEach(([blockchain, providers]) => {
		const jsonRpcUrls = getEnv(
			`${blockchain.toUpperCase()}_JSON_RPC_URLS`,
			""
		);

		if (jsonRpcUrls) {
			jsonRpcUrls
				.split(",")
				.forEach((jsonRpcUrl) =>
					providers.push({ url: jsonRpcUrl.trim() })
				);
		}
	});
	return providers;
}
