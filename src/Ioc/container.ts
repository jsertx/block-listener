import { EventEmitter } from "eventemitter3";
import { AsyncContainerModule, Container } from "inversify";
import { Config } from "../Config/Config";
import { EventBroker } from "../Services/Broker/EventBroker";
import { WinstonLogger } from "../Services/WinstonLogger";
import { ProviderFactory } from "../Services/Providers/ProviderFactory";
import { BlockListener } from "../UseCases/BlockListener";
import { FindDirectTx } from "../UseCases/FindDirectTx";
import { SaveTransaction } from "../UseCases/SaveTransaction";
import { IocKey } from "./IocKey";
import { TxRepository } from "../Repository/TxRepository";
import { createConnection } from "../Database/utils";

export const initializeContainer = async () => {
  const bindings = new AsyncContainerModule(async (bind) => {
    bind(IocKey.Config).toConstantValue(Config);
    bind(IocKey.Broker).to(EventBroker).inSingletonScope();
    bind(IocKey.ProviderFactory).to(ProviderFactory).inSingletonScope();
    bind(IocKey.Logger).to(WinstonLogger).inSingletonScope();

    const dbClient = await createConnection(Config.database.connectionUri);

    bind(IocKey.DbClient).toConstantValue(dbClient);
    bind(IocKey.TxRepository).to(TxRepository).inSingletonScope();

    bind(FindDirectTx).toSelf().inSingletonScope();
    bind(BlockListener).toSelf().inSingletonScope();
    bind(SaveTransaction).toSelf().inSingletonScope();
  });

  const container = new Container();
  await container.loadAsync(bindings);
  return container;
};
