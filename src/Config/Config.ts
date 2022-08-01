import { IConfig } from "../Interfaces/IConfig";
import { getEnv } from "../App/Utils/Env";
import { BlockchainId } from "./Blockchains";

export const Config: IConfig = {
	providers: {
		etherScanApiKey: getEnv("ETHERSCAN_API_KEY"),
		alchemyJsonRpcUrl: getEnv("ALCHEMY_JSON_RPC_URL", "")
	},
	enabledBlockchains: [BlockchainId.Ethereum],
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
