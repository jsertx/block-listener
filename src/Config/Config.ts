import { IConfig } from "../Interfaces/IConfig";
import { getEnv } from "../App/Utils/Env";

export const Config: IConfig = {
  providers: {
    etherScanApiKey: getEnv("ETHERSCAN_API_KEY"),
    alchemyJsonRpcUrl: getEnv("ALCHEMY_JSON_RPC_URL", ""),
  },
  database: {
    database: getEnv("DATABASE_NAME", "blocklistener"),
    connectionUri: getEnv("DATABASE_URI"),
  },
  http: {
    port: getEnv("PORT"),
  },
  broker: {
    brokerUri: getEnv("BROKER_URI"),
  },
  txRules: {
    minEthValue: "10",
  },
};
