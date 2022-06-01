import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { startApi } from "./Api/Server";

(async () => {
  const container = await initializeContainer();
  startApi(container);
})();
