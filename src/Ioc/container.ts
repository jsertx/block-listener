import { AsyncContainerModule, Container } from "inversify";
import { Config } from "../Config/Config";
import { WinstonLogger } from "../Infrastructure/WinstonLogger";
import { ProviderFactory } from "../App/Services/Providers/ProviderFactory";

import { IocKey } from "./IocKey";
import { TxRepository } from "../Infrastructure/Repository/TxRepository";
import { createConnection } from "../Infrastructure/Database/utils";
import { WalletRepository } from "../Infrastructure/Repository/WalletRepository";
import { ContractRepository } from "../Infrastructure/Repository/ContractRepository";
import { FindDirectTx } from "../App/UseCases/FindDirectTx";
import { BlockListener } from "../App/UseCases/BlockListener";

import { HttpAdapter } from "../Api/Http/HttpAdapter";
import { SaveTx } from "../App/UseCases/SaveTx";
import { TxProcessor } from "../App/Services/TxProcessor/TxProcessor";
import { TokenRepository } from "../Infrastructure/Repository/TokenRepository";
import { NativeTransferProcessor } from "../App/Services/TxProcessor/Strategies/NativeTransferProcessor";
import { DexSwapProcessor } from "../App/Services/TxProcessor/Strategies/DexSwapProcessor";
import { SaveToken } from "../App/UseCases/Tokens/SaveToken";
import { SaveWallet } from "../App/UseCases/Wallets/SaveWallet";
import { CovalentApi } from "../App/Services/BlockchainService/CovalentApi";
import { MemoryCache } from "../App/Services/MemoryCache";

import { BlockRepository } from "../Infrastructure/Repository/BlockRepository";
import { createBrokerConnection } from "../Infrastructure/Broker/Rabbitmq/Utils/ConfigCreation";
import { RabbitMQ } from "../Infrastructure/Broker/RabbitMQ";
import { FinnhubApiService } from "../App/Services/PriceService/FinnhubApiService";
import { TokenService } from "../App/Services/TokenService";

export const initializeContainer = async () => {
	const bindings = new AsyncContainerModule(async (bind) => {
		// Services
		bind(IocKey.Config).toConstantValue(Config);
		bind(IocKey.ProviderFactory).to(ProviderFactory).inSingletonScope();
		bind(IocKey.Cache).to(MemoryCache).inSingletonScope();
		bind(IocKey.Logger).to(WinstonLogger).inSingletonScope();
		bind(IocKey.PriceService).to(FinnhubApiService).inSingletonScope();
		bind(IocKey.BlockchainService).to(CovalentApi).inSingletonScope();
		bind(IocKey.TokenService).to(TokenService).inSingletonScope();
		// TxProcessor
		bind(IocKey.TxProcessor).to(TxProcessor).inSingletonScope();
		[NativeTransferProcessor, DexSwapProcessor].forEach((processor) =>
			bind(IocKey.TxProcessorStrategy).to(processor).inSingletonScope()
		);
		// UseCases
		[
			BlockListener
			//,SelectivePairDiscoverer
		].forEach((app) => {
			bind(IocKey.StandAloneApps).to(app).inSingletonScope();
		});
		// Executors
		[
			SaveTx,
			SaveToken,
			SaveWallet,
			FindDirectTx
			/*FindInternalTx,*/
		].forEach((app) => bind(IocKey.Executors).to(app).inSingletonScope());

		// Adapters
		bind(IocKey.Adapters).to(HttpAdapter).inRequestScope();
		// Brokers
		bind(IocKey.RabbitMQClient).toConstantValue(
			await createBrokerConnection(Config)
		);
		bind(IocKey.Broker).to(RabbitMQ).inSingletonScope();

		// DB & Repos
		bind(IocKey.DbClient).toConstantValue(
			await createConnection(Config.database.connectionUri)
		);
		bind(IocKey.TxRepository).to(TxRepository).inSingletonScope();
		bind(IocKey.ContractRepository)
			.to(ContractRepository)
			.inSingletonScope();
		bind(IocKey.TokenRepository).to(TokenRepository).inSingletonScope();
		bind(IocKey.WalletRepository).to(WalletRepository).inSingletonScope();
		bind(IocKey.BlockRepository).to(BlockRepository).inSingletonScope();
	});

	const container = new Container();
	container.bind(IocKey.Container).toConstantValue(container);
	await container.loadAsync(bindings);
	return container;
};
