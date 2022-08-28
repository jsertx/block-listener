import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IStandaloneApps } from "./App/Interfaces/IStandaloneApps";
import { IAdapter } from "./Interfaces/IAdapter";
import { IExecutor } from "./Interfaces/IExecutor";
import { getEnv } from "./App/Utils/Env";

async function main() {
	const container = await initializeContainer();
	container
		.getAll<IAdapter>(IocKey.Adapters)
		.forEach((adapter) => adapter.start());

	if (getEnv("HALT", "0") === "1") {
		return;
	}
	container.getAll<IExecutor>(IocKey.Executors).forEach((listener) => {
		listener.start();
		listener.startRetryManager();
	});
	container.getAll<IStandaloneApps>(IocKey.StandAloneApps).forEach((app) => {
		app.start();
	});
}

// eslint-disable-next-line no-console
main().catch(console.error);
