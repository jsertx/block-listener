import { EventEmitter } from "eventemitter3";
import { AsyncContainerModule, Container } from "inversify";
import { Config } from "../Config/Config";
import { EventBroker } from "../Services/Broker/EventBroker";
import { WinstonLogger } from "../Services/WinstonLogger";
import { ProviderFactory } from "../Services/Providers/ProviderFactory";
import { BlockListener } from "../UseCases/BlockListener";

import { SaveTokenTx } from "../UseCases/SaveTokenTx";
import { IocKey } from "./IocKey";
import { TxRepository } from "../Repository/TxRepository";
import { createConnection } from "../Database/utils";
import { AddressRepository } from "../Repository/AddressRepository";
import { ProcessTx } from "../UseCases/ProcessTx";
import { SaveDexTx } from "../UseCases/SaveDexTx";
import { SaveEthTx } from "../UseCases/SaveEthTx";

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

    bind(BlockListener).toSelf().inSingletonScope();
    bind(ProcessTx).toSelf().inSingletonScope();
    bind(SaveTokenTx).toSelf().inSingletonScope();
    bind(SaveDexTx).toSelf().inSingletonScope();
    bind(SaveEthTx).toSelf().inSingletonScope();
  });

  const container = new Container();
  await container.loadAsync(bindings);
  return container;
};
