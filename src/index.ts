import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IListenerUseCase } from "./Interfaces/IListenerUseCase";
import { IAdapter } from "./Interfaces/IAdapter";

(async () => {
  const container = await initializeContainer();

  container
    .getAll<IListenerUseCase>(IocKey.ListenerUseCases)
    .forEach((listener) => listener.listen());

  container
    .getAll<IAdapter>(IocKey.Adapters)
    .forEach((adapter) => adapter.start());
})();
