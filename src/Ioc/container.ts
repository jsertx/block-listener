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
import { FindInternalTx } from "../App/UseCases/FindInternalTx";
import { BlockListener } from "../App/UseCases/BlockListener";

import { HttpAdapter } from "../Api/Http/HttpAdapter";
import { SaveTx } from "../App/UseCases/SaveTx";
import { TxProcessor } from "../App/Services/TxProcessor/TxProcessor";
import { SelectivePairDiscoverer } from "../App/UseCases/SelectivePairDiscoverer";
import { TokenRepository } from "../Infrastructure/Repository/TokenRepository";
import { NativeTransferProcessor } from "../App/Services/TxProcessor/Strategies/NativeTransferProcessor";
import { DexSwapProcessor } from "../App/Services/TxProcessor/Strategies/DexSwapProcessor";
import { PriceService } from "../App/Services/PriceService";
import { SaveToken } from "../App/UseCases/Tokens/SaveToken";
import { SaveWhale } from "../App/UseCases/Whales/SaveWhale";
import { RabbitMQ } from "../Infrastructure/Broker/RabbitMQ";
import { createBrokerConnection } from "../Infrastructure/Broker/Rabbitmq/Utils/ConfigCreation";
import { CovalentApi } from "../App/Services/BlockchainService/CovalentApi";

export const initializeContainer = async () => {
	const bindings = new AsyncContainerModule(async (bind) => {
		// Services
		bind(IocKey.Config).toConstantValue(Config);
		bind(IocKey.ProviderFactory).to(ProviderFactory).inSingletonScope();
		bind(IocKey.Logger).to(WinstonLogger).inSingletonScope();
		bind(IocKey.PriceService).to(PriceService).inSingletonScope();
		bind(IocKey.BlockchainService).to(CovalentApi).inSingletonScope();
		// TxProcessor
		bind(IocKey.TxProcessor).to(TxProcessor).inSingletonScope();
		[NativeTransferProcessor, DexSwapProcessor].forEach((processor) =>
			bind(IocKey.TxProcessorStrategy).to(processor).inSingletonScope()
		);
		// UseCases
		[BlockListener, SelectivePairDiscoverer].forEach((app) =>
			bind(IocKey.StandAloneApps).to(app).inSingletonScope()
		);
		// Executors
		[SaveTx, SaveToken, SaveWhale, FindInternalTx, FindDirectTx].forEach(
			(app) => bind(IocKey.Executors).to(app).inSingletonScope()
		);

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
	});

	const container = new Container();
	container.bind(IocKey.Container).toConstantValue(container);
	await container.loadAsync(bindings);
	return container;
};
