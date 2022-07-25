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
import { ProcessTx } from "../App/UseCases/ProcessTx";

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
    bind(IocKey.ListenerUseCases).to(SaveTx).inSingletonScope();
    bind(IocKey.ListenerUseCases).to(FindDirectTx).inSingletonScope();
    bind(IocKey.ListenerUseCases).to(FindInternalTx).inSingletonScope();
    bind(IocKey.ListenerUseCases).to(BlockListener).inSingletonScope();
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
    bind(IocKey.WalletRepository).to(WalletRepository).inSingletonScope();
  });

  const container = new Container();
  container.bind(IocKey.Container).toConstantValue(container);
  await container.loadAsync(bindings);
  return container;
};
