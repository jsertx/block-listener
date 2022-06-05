export interface IConfig {
  providers: {
    etherScanApiKey: string;
  };
  database: {
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
