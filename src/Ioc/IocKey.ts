export const IocKey = {
  Container: Symbol.for("Container"),
  Config: Symbol.for("Config"),
  ProviderFactory: Symbol.for("ProviderFactory"),
  AddressService: Symbol.for("AddressService"),
  ContractFactory: Symbol.for("ContractFactory"),
  Logger: Symbol.for("Logger"),
  PriceService: Symbol.for("PriceService"),
  // Adapters
  Adapters: Symbol.for("Adapters"),
  // UseCases
  StandAloneApps: Symbol.for("StandAloneApps"),
  TxProcessor: Symbol.for("TxProcessor"),
  TxProcessorStrategy: Symbol.for("TxProcessorStrategy"),
  // Broker
  BrokerClient: Symbol.for("BrokerClient"),
  Broker: Symbol.for("Broker"),
  // DB & Repositories
  DbClient: Symbol.for("DbClient"),
  TxRepository: Symbol.for("TxRepository"),
  ContractRepository: Symbol.for("ContractRepository"),
  WalletRepository: Symbol.for("WalletRepository"),
  TokenRepository: Symbol.for("TokenRepository"),
};
