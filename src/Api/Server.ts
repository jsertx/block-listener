import * as bodyParser from "body-parser";
import { InversifyExpressServer } from "inversify-express-utils";
import { container } from "../Ioc/container";

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
  app.listen(80);
};
