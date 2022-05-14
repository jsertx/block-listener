import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";
import { BlockListener } from "./UseCases/BlockListener";
import { SaveTokenTx } from "./UseCases/SaveTokenTx";
import { startApi } from "./Api/Server";
import { ProcessTx } from "./UseCases/ProcessTx";

(async () => {
  const container = await initializeContainer();

  container.get(SaveTokenTx).execute();
  container.get(ProcessTx).execute();
  container.get(BlockListener).execute();

  startApi(container);
})();
