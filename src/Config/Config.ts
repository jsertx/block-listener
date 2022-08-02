import { IConfig } from "../Interfaces/IConfig";
import { getEnv } from "../App/Utils/Env";
import { BlockchainId } from "./Blockchains";

export const Config: IConfig = {
	providers: prepareNodeList({
		[BlockchainId.Ethereum]: [{ url: "https://eth.public-rpc.com" }],
		[BlockchainId.Polygon]: [
			{
				url: "https://rpc.ankr.com/polygon"
			}
		]
	}),
	enabledBlockchains: [BlockchainId.Ethereum, BlockchainId.Polygon],
	database: {
		database: getEnv("DATABASE_NAME", "blocklistener"),
		connectionUri: getEnv("DATABASE_URI")
	},
	http: {
		port: getEnv("PORT")
	},
	broker: {
		brokerUri: getEnv("BROKER_URI")
	},
	txRules: {
		minNativeTransferValue: "10",
		minDexSwapValueInUsd: `${10_000}`
	},
	covalent: {
		apiKey: getEnv("COVALENT_API_KEY")
	}
};

function prepareNodeList(
	providers: IConfig["providers"]
): IConfig["providers"] {
	Object.entries(providers).forEach(([blockchain, providers]) => {
		const alchemyJsonRpcUrl = getEnv(
			`${blockchain.toUpperCase()}_ALCHEMY_JSON_RPC_URL`,
			""
		);
		if (alchemyJsonRpcUrl) {
			providers.push({ url: alchemyJsonRpcUrl });
		}
	});
	return providers;
}
