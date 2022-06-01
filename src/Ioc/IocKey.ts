export const IocKey = {
  Config: Symbol.for("Config"),
  ProviderFactory: Symbol.for("ProviderFactory"),
  AddressService: Symbol.for("AddressService"),
  ContractFactory: Symbol.for("ContractFactory"),
  Broker: Symbol.for("Broker"),
  Logger: Symbol.for("Logger"),

  // DB & Repositories
  DbClient: Symbol.for("DbClient"),
  TxRepository: Symbol.for("TxRepository"),
  ContractRepository: Symbol.for("ContractRepository"),
  WalletRepository: Symbol.for("WalletRepository"),
  TokenRepository: Symbol.for("TokenRepository"),
};
