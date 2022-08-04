import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IStandaloneApps } from "./App/Interfaces/IStandaloneApps";
import { IAdapter } from "./Interfaces/IAdapter";
import { IExecutor } from "./Interfaces/IExecutor";

(async () => {
	const container = await initializeContainer();

	container.getAll<IStandaloneApps>(IocKey.StandAloneApps).forEach((app) => {
		app.start();
	});

	container.getAll<IExecutor>(IocKey.Executors).forEach((listener) => {
		listener.start();
		listener.startRetryManager();
	});

	container
		.getAll<IAdapter>(IocKey.Adapters)
		.forEach((adapter) => adapter.start());
})();
