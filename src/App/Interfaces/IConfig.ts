export interface IConfig {
  providers: {
    etherScanApiKey: string;
  };
  database: {
    connectionUri: string;
  };
  txRules: {
    minEthValue: string;
  };
}
