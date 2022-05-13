import { EventEmitter } from "eventemitter3";
import { Container } from "inversify";
import { Config } from "../Config/Config";
import { EventBroker } from "../Services/Broker/EventBroker";
import { WinstonLogger } from "../Services/WinstonLogger";
import { ProviderFactory } from "../Services/Providers/ProviderFactory";
import { BlockListener } from "../UseCases/BlockListener";
import { FindDirectTx } from "../UseCases/FindDirectTx";
import { SaveTransaction } from "../UseCases/SaveTransaction";
import { IocKey } from "./IocKey";

export const container = new Container();

container.bind(IocKey.Config).toConstantValue(Config);
container.bind(IocKey.Broker).to(EventBroker).inSingletonScope();
container.bind(IocKey.ProviderFactory).to(ProviderFactory).inSingletonScope();
container.bind(IocKey.Logger).to(WinstonLogger).inSingletonScope();

container.bind(FindDirectTx).toSelf().inRequestScope();
container.bind(BlockListener).toSelf().inRequestScope();
container.bind(SaveTransaction).toSelf().inRequestScope();
