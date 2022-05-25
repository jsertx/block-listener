export const IocKey = {
  Config: Symbol.for("Config"),
  ProviderFactory: Symbol.for("ProviderFactory"),
  ContractFactory: Symbol.for("ContractFactory"),
  Broker: Symbol.for("Broker"),
  Logger: Symbol.for("Logger"),

  // DB & Repositories
  DbClient: Symbol.for("DbClient"),
  TxRepository: Symbol.for("TxRepository"),
  AddressRepository: Symbol.for("AddressRepository"),
  TokenRepository: Symbol.for("TokenRepository"),
};
