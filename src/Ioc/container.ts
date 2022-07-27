import { AsyncContainerModule, Container } from "inversify";
import { Config } from "../Config/Config";
import { EventBus } from "../App/Services/Broker/EventBroker";
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
import { AddressService } from "../App/Services/AddressService";
import { SaveTx } from "../App/UseCases/SaveTx";
import { TxProcessor } from "../App/Services/TxProcessor/TxProcessor";
import { SelectivePairDiscoverer } from "../App/UseCases/SelectivePairDiscoverer";
import { TokenRepository } from "../Infrastructure/Repository/TokenRepository";
import { NativeTransferProcessor } from "../App/Services/TxProcessor/Strategies/NativeTransferProcessor";
import { DexSwapProcessor } from "../App/Services/TxProcessor/Strategies/DexSwapProcessor";

export const initializeContainer = async () => {
  const bindings = new AsyncContainerModule(async (bind) => {
    // Services
    bind(IocKey.Config).toConstantValue(Config);
    bind(IocKey.EventBus).to(EventBus).inSingletonScope();
    bind(IocKey.ProviderFactory).to(ProviderFactory).inSingletonScope();
    bind(IocKey.Logger).to(WinstonLogger).inSingletonScope();
    bind(IocKey.AddressService).to(AddressService).inSingletonScope();
    // TxProcessor
    bind(IocKey.TxProcessor).to(TxProcessor).inSingletonScope();
    [NativeTransferProcessor, DexSwapProcessor].forEach((processor) =>
      bind(IocKey.TxProcessorStrategy).to(processor).inSingletonScope()
    );
    // UseCases
    [
      SaveTx,
      FindDirectTx,
      FindInternalTx,
      BlockListener,
      SelectivePairDiscoverer,
    ].forEach((app) => bind(IocKey.StandAloneApps).to(app).inSingletonScope());

    // Broker & DB Connections
    const dbClient = await createConnection(Config.database.connectionUri);
    //const brokerClient = await createBrokerConnection(Config.broker.brokerUri),

    bind(IocKey.Adapters).to(HttpAdapter).inRequestScope();
    //bind(IocKey.Adapters).to(BrokerAdapter).inRequestScope();
    //bind(IocKey.BrokerClient).toConstantValue(brokerClient);
    //bind(IocKey.Broker).to(RabbitMQ).inSingletonScope();

    bind(IocKey.DbClient).toConstantValue(dbClient);
    bind(IocKey.TxRepository).to(TxRepository).inSingletonScope();
    bind(IocKey.ContractRepository).to(ContractRepository).inSingletonScope();
    bind(IocKey.TokenRepository).to(TokenRepository).inSingletonScope();
    bind(IocKey.WalletRepository).to(WalletRepository).inSingletonScope();
  });

  const container = new Container();
  container.bind(IocKey.Container).toConstantValue(container);
  await container.loadAsync(bindings);
  return container;
};
