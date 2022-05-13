import * as bodyParser from "body-parser";
import { InversifyExpressServer } from "inversify-express-utils";
import { ILogger } from "../Interfaces/ILogger";
import { container } from "../Ioc/container";
import { IocKey } from "../Ioc/IocKey";
import { getEnv } from "../Utils/Env";

import "./Controllers/StatusController";
export const startApi = () => {
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
  const port = getEnv("API_PORT", "3000");
  app.listen(port, () => {
    container.get<ILogger>(IocKey.Logger).log({
      type: "api.start",
      message: `Api started listening on port ${port}`,
    });
  });
};
