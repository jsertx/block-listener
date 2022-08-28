export const IocKey = {
	Container: Symbol.for("Container"),
	Config: Symbol.for("Config"),
	ProviderFactory: Symbol.for("ProviderFactory"),
	ContractFactory: Symbol.for("ContractFactory"),
	Logger: Symbol.for("Logger"),
	PriceService: Symbol.for("PriceService"),
	Cache: Symbol.for("Cache"),
	// BlockchainService
	BlockchainService: Symbol.for("BlockchainService"),
	TokenService: Symbol.for("TokenService"),
	// Executor
	Executors: Symbol.for("Executors"),
	// Adapters
	Adapters: Symbol.for("Adapters"),
	// UseCases
	StandAloneApps: Symbol.for("StandAloneApps"),
	TxProcessor: Symbol.for("TxProcessor"),
	TxProcessorStrategy: Symbol.for("TxProcessorStrategy"),
	// Broker
	RabbitMQClient: Symbol.for("RabbitMQClient"),
	Broker: Symbol.for("Broker"),
	// DB & Repositories
	DbClient: Symbol.for("DbClient"),
	TxRepository: Symbol.for("TxRepository"),
	ContractRepository: Symbol.for("ContractRepository"),
	WalletRepository: Symbol.for("WalletRepository"),
	TokenRepository: Symbol.for("TokenRepository"),
	BlockRepository: Symbol.for("BlockRepository")
};
