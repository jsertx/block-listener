export const IocKey = {
  Config: Symbol.for("Config"),
  ProviderFactory: Symbol.for("ProviderFactory"),
  Broker: Symbol.for("Broker"),
  Logger: Symbol.for("Logger"),

  // DB & Repositories
  DbClientProvider: Symbol.for("Provider<DbClient>"),
  TxRepository: Symbol.for("TxRepository"),
};
