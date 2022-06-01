import { AsyncContainerModule, Container } from "inversify";
import { Config } from "../Config/Config";
import { EventBus } from "../App/Services/Broker/EventBroker";
import { WinstonLogger } from "../Infrastructure/WinstonLogger";
import { ProviderFactory } from "../App/Services/Providers/ProviderFactory";

import { IocKey } from "./IocKey";
import { TxRepository } from "../Infrastructure/Repository/TxRepository";
import { createConnection } from "../Infrastructure/Database/utils";
import { AddressService } from "../Domain/Services/AddressService";
import { WalletRepository } from "../Infrastructure/Repository/WalletRepository";
import { ContractRepository } from "../Infrastructure/Repository/ContractRepository";
import { ProcessTx } from "../App/UseCases/ProcessTx";
import { BlockListener } from "../App/UseCases/BlockListener";
import { SaveEthTx } from "../App/UseCases/SaveEthTx";
import { SaveDexTx } from "../App/UseCases/SaveDexTx";
import { SaveTokenTx } from "../App/UseCases/SaveTokenTx";

export const initializeContainer = async () => {
  const bindings = new AsyncContainerModule(async (bind) => {
    // Services
    bind(IocKey.Config).toConstantValue(Config);
    bind(IocKey.Broker).to(EventBus).inSingletonScope();
    bind(IocKey.ProviderFactory).to(ProviderFactory).inSingletonScope();
    bind(IocKey.Logger).to(WinstonLogger).inSingletonScope();
    bind(IocKey.AddressService).to(AddressService).inSingletonScope();
    // UseCases
    bind(ProcessTx).toSelf().inSingletonScope();
    bind(BlockListener).toSelf().inSingletonScope();
    bind(SaveEthTx).toSelf().inSingletonScope();
    bind(SaveDexTx).toSelf().inSingletonScope();
    bind(SaveTokenTx).toSelf().inSingletonScope();
    // Database
    const dbClient = await createConnection(Config.database.connectionUri);
    bind(IocKey.DbClient).toConstantValue(dbClient);
    bind(IocKey.TxRepository).to(TxRepository).inSingletonScope();
    bind(IocKey.ContractRepository).to(ContractRepository).inSingletonScope();
    bind(IocKey.WalletRepository).to(WalletRepository).inSingletonScope();
  });

  const container = new Container();
  await container.loadAsync(bindings);
  return container;
};
