export interface IConfig {
  providers: {
    etherScanApiKey: string;
  };
  database: {
    connectionUri: string;
  };
  broker: {
    brokerUri: string;
  };
  txRules: {
    minEthValue: string;
  };
}
