import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IStandaloneApps } from "./App/Interfaces/IStandaloneApps";
import { IAdapter } from "./Interfaces/IAdapter";

(async () => {
  const container = await initializeContainer();

  container
    .getAll<IStandaloneApps>(IocKey.StandAloneApps)
    .forEach((listener) => listener.start());

  container
    .getAll<IAdapter>(IocKey.Adapters)
    .forEach((adapter) => adapter.start());
})();
