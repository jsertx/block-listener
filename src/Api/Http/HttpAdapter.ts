import * as bodyParser from "body-parser";

import { Container, inject, injectable } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { ILogger } from "../../Interfaces/ILogger";
import { GlobalErrorMiddleware } from "./Middleware/GlobalErrorMiddleware";

import { IocKey } from "../../Ioc/IocKey";
import { ApiTokenAuthMiddleware } from "./Middleware/ApiTokenAuthMiddleware";
import { IAdapter } from "../../Interfaces/IAdapter";
import { IConfig } from "../../Interfaces/IConfig";

import "./Controllers/StatusController";
import "./Controllers/TxController";
import "./Controllers/ContractController";
import "./Controllers/TokenController";
import "./Controllers/WalletController";

@injectable()
export class HttpAdapter implements IAdapter {
	constructor(
		@inject(IocKey.Container) private container: Container,
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.Config) private config: IConfig
	) {}
	start(): void {
		// create server
		const server = new InversifyExpressServer(this.container);

		server.setConfig((app) => {
			// add body parser
			app.use(
				bodyParser.urlencoded({
					extended: true
				})
			);
			app.use(bodyParser.json());
			app.use(ApiTokenAuthMiddleware(this.logger));
		});

		server.setErrorConfig((app) => {
			app.use(GlobalErrorMiddleware(this.logger));
		});

		const app = server.build();

		app.listen(this.config.http.port, () => {
			this.logger.log({
				type: "api.start",
				message: `Api started listening on port ${this.config.http.port}`
			});
		});
	}
}
