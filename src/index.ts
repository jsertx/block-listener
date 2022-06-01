import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { startApi } from "./Api/Http/Server";
import { ProcessTx } from "./App/UseCases/ProcessTx";
import { BlockListener } from "./App/UseCases/BlockListener";
import { SaveEthTx } from "./App/UseCases/SaveEthTx";
import { SaveDexTx } from "./App/UseCases/SaveDexTx";
import { SaveTokenTx } from "./App/UseCases/SaveTokenTx";

(async () => {
  const container = await initializeContainer();

  container.get(ProcessTx).execute();
  container.get(BlockListener).execute();
  container.get(SaveEthTx).execute();
  container.get(SaveDexTx).execute();
  container.get(SaveTokenTx).execute();

  startApi(container);
})();
