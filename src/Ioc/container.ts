import { AsyncContainerModule, Container } from "inversify";
import { Config } from "../Config/Config";
import { EventBroker } from "../App/Services/Broker/EventBroker";
import { WinstonLogger } from "../App/Services/WinstonLogger";
import { ProviderFactory } from "../App/Services/Providers/ProviderFactory";

import { IocKey } from "./IocKey";
import { TxRepository } from "../Infrastructure/Repository/TxRepository";
import { createConnection } from "../Infrastructure/Database/utils";
import { AddressRepository } from "../Infrastructure/Repository/AddressRepository";

export const initializeContainer = async () => {
  const bindings = new AsyncContainerModule(async (bind) => {
    bind(IocKey.Config).toConstantValue(Config);
    bind(IocKey.Broker).to(EventBroker).inSingletonScope();
    bind(IocKey.ProviderFactory).to(ProviderFactory).inSingletonScope();
    bind(IocKey.Logger).to(WinstonLogger).inSingletonScope();

    const dbClient = await createConnection(Config.database.connectionUri);

    bind(IocKey.DbClient).toConstantValue(dbClient);
    bind(IocKey.TxRepository).to(TxRepository).inSingletonScope();
    bind(IocKey.AddressRepository).to(AddressRepository).inSingletonScope();
  });

  const container = new Container();
  await container.loadAsync(bindings);
  return container;
};
