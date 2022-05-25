import * as bodyParser from "body-parser";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { ILogger } from "../App/Interfaces/ILogger";

import { IocKey } from "../Ioc/IocKey";
import { getEnv } from "../App/Utils/Env";

import "./Controllers/StatusController";
import "./Controllers/TxController";
import "./Controllers/AddressController";

export const startApi = (container: Container) => {
  // create server
  const server = new InversifyExpressServer(container);
  server.setConfig((app) => {
    // add body parser
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
    app.use(bodyParser.json());
  });

  let app = server.build();
  const port = getEnv("PORT", "3000");
  app.listen(port, () => {
    container.get<ILogger>(IocKey.Logger).log({
      type: "api.start",
      message: `Api started listening on port ${port}`,
    });
  });
};
