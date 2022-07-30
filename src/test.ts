import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IStandaloneApps } from "./App/Interfaces/IStandaloneApps";
import { IBroker } from "./Interfaces/IBroker";
import { SaveTx } from "./App/UseCases/SaveTx";
import { Blockchain, BlockchainId } from "./App/Values/Blockchain";
import { Publication } from "./Infrastructure/Broker/Publication";

(async () => {
  const container = await initializeContainer();

  container
    .getAll<IStandaloneApps>(IocKey.StandAloneApps)
    .filter((listener) => {
      return ["SaveWhale", "SaveTx", "SaveToken"].includes(
        listener.constructor.name
      );
    })
    .forEach((listener) => listener.start());
})();
