import { BrokerType, IConfig } from "../Interfaces/IConfig";
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
	logtail: {
		accessToken: getEnv("LOGTAIL_ACCESS_TOKEN", "")
	},
	http: {
		port: getEnv("PORT", "80")
	},
	broker: {
		type: BrokerType.Rabbit,
		config: {
			uri: getEnv("BROKER_URI"),
			apiUrl: getEnv("BROKER_API_URL")
		}
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
		const jsonRpcUrlCfgs = getEnv(
			`${blockchain.toUpperCase()}_JSON_RPC_URLS`,
			""
		);
		if (jsonRpcUrlCfgs) {
			(JSON.parse(jsonRpcUrlCfgs) as JsonRpcConfig[])
				.map(validateInlineJsonRpcCfg)
				.forEach(({ maxConcurrent, minTime, url }) => {
					providers.push({
						url,
						rateConfig: {
							maxConcurrent,
							minTime
						}
					});
				});
		}
	});
	return providers;
}
interface JsonRpcConfig {
	maxConcurrent: number | undefined;
	minTime: number | undefined;
	url: string;
}
function validateInlineJsonRpcCfg({
	url,
	maxConcurrent,
	minTime
}: JsonRpcConfig): {
	maxConcurrent: number | undefined;
	minTime: number | undefined;
	url: string;
} {
	if (!url) {
		throw new Error("Invalidurl");
	}
	return {
		maxConcurrent,
		minTime,
		url
	};
}
