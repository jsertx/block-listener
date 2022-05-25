import { IConfig } from "../App/Interfaces/IConfig";
import { getEnv } from "../App/Utils/Env";

export const Config: IConfig = {
  providers: {
    etherScanApiKey: getEnv("ETHERSCAN_API_KEY"),
  },
  database: {
    connectionUri: getEnv("DATABASE_URI"),
  },
  txRules: {
    minEthValue: "10",
  },
};
