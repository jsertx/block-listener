export interface IConfig {
  providers: {
    etherScanApiKey: string;
    alchemyJsonRpcUrl?: string;
  };
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
    minEthValue: string;
  };
}
