import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";
import { BlockListener } from "./UseCases/BlockListener";
import { FindDirectTx } from "./UseCases/FindDirectTx";
import { SaveTransaction } from "./UseCases/SaveTransaction";
import { startApi } from "./Api/Server";

(async () => {
  const container = await initializeContainer();

  container.get(FindDirectTx).execute();
  container.get(SaveTransaction).execute();
  container.get(BlockListener).execute();

  startApi(container);
})();
