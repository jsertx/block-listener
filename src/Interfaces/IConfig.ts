import { BlockchainId } from "../Config/Blockchains";

export interface IConfig {
  providers: {
    etherScanApiKey: string;
    alchemyJsonRpcUrl?: string;
  };
  enabledBlockchains: BlockchainId[];
  database: {
    database?: string;
    connectionUri: string;
  };
  http: {
    port: string;
  };
  broker: {
    brokerUri: string;
  };
  txRules: {
    minNativeTransferValue: string;
    minDexSwapValueInUsd: string;
  };
}
