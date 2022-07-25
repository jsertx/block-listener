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
import { ProcessTx } from "../App/UseCases/ProcessTx";
import { BlockListener } from "../App/UseCases/BlockListener";
import { SaveEthTx } from "../App/UseCases/SaveEthTx";
import { SaveDexTx } from "../App/UseCases/SaveDexTx";
import { SaveTokenTx } from "../App/UseCases/SaveTokenTx";
import { createBrokerConnection } from "../Infrastructure/Broker/Utils/Mq";
import { RabbitMQ } from "../Infrastructure/Broker/RabbitMQ";
import { BrokerAdapter } from "../Api/Broker/BrokerAdapter";
import { HttpAdapter } from "../Api/Http/HttpAdapter";
import { AddressService } from "../App/Services/AddressService";

export const initializeContainer = async () => {
  const bindings = new AsyncContainerModule(async (bind) => {
    // Services
    bind(IocKey.Config).toConstantValue(Config);
    bind(IocKey.EventBus).to(EventBus).inSingletonScope();
    bind(IocKey.ProviderFactory).to(ProviderFactory).inSingletonScope();
    bind(IocKey.Logger).to(WinstonLogger).inSingletonScope();
    bind(IocKey.AddressService).to(AddressService).inSingletonScope();
    // UseCases
    bind(IocKey.ListenerUseCases).to(ProcessTx).inSingletonScope();
    bind(IocKey.ListenerUseCases).to(BlockListener).inSingletonScope();
    bind(IocKey.ListenerUseCases).to(SaveEthTx).inSingletonScope();
    bind(IocKey.ListenerUseCases).to(SaveDexTx).inSingletonScope();
    bind(IocKey.ListenerUseCases).to(SaveTokenTx).inSingletonScope();
    // Broker & DB Connections
    const [dbClient, brokerClient] = await Promise.all([
      createConnection(Config.database.connectionUri),
      createBrokerConnection(Config.broker.brokerUri),
    ]);

    bind(IocKey.Adapters).to(HttpAdapter).inRequestScope();
    bind(IocKey.Adapters).to(BrokerAdapter).inRequestScope();

    bind(IocKey.BrokerClient).toConstantValue(brokerClient);
    bind(IocKey.Broker).to(RabbitMQ).inSingletonScope();

    bind(IocKey.DbClient).toConstantValue(dbClient);
    bind(IocKey.TxRepository).to(TxRepository).inSingletonScope();
    bind(IocKey.ContractRepository).to(ContractRepository).inSingletonScope();
    bind(IocKey.WalletRepository).to(WalletRepository).inSingletonScope();
  });

  const container = new Container();
  container.bind(IocKey.Container).toConstantValue(container);
  await container.loadAsync(bindings);
  return container;
};
