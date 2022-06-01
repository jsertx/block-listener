import * as bodyParser from "body-parser";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { ILogger } from "../../Interfaces/ILogger";
import { GlobalErrorMiddleware } from "./Middleware/GlobalErrorMiddleware";

import { IocKey } from "../../Ioc/IocKey";
import { getEnv } from "../../App/Utils/Env";

import "./Controllers/StatusController";
import "./Controllers/TxController";
import "./Controllers/ContractController";
import "./Controllers/WalletController";
import { ApiTokenAuthMiddleware } from "./Middleware/ApiTokenAuthMiddleware";

export const startApi = (container: Container) => {
  // create server
  const server = new InversifyExpressServer(container);
  const logger = container.get<ILogger>(IocKey.Logger);
  server.setConfig((app) => {
    // add body parser
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
    app.use(bodyParser.json());
    app.use(ApiTokenAuthMiddleware(logger));
  });

  server.setErrorConfig((app) => {
    app.use(GlobalErrorMiddleware(logger));
  });

  const app = server.build();
  const port = getEnv("PORT", "3000");
  app.listen(port, () => {
    logger.log({
      type: "api.start",
      message: `Api started listening on port ${port}`,
    });
  });
};
