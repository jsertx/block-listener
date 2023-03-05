import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IStandaloneApps } from "./App/Interfaces/IStandaloneApps";
import { IAdapter } from "./Interfaces/IAdapter";
import { IExecutor } from "./Interfaces/IExecutor";
import { getEnv } from "./App/Utils/Env";
import { ILogger } from "./Interfaces/ILogger";

async function main() {
	const container = await initializeContainer();
	const logger = container.get<ILogger>(IocKey.Logger);
	if (process.env.DEV === "1") {
		await (container.get(IocKey.Playground) as any).execute();
		return;
	}
	container
		.getAll<IAdapter>(IocKey.Adapters)
		.forEach((adapter) => adapter.start());

	if (getEnv("API_ONLY", "0") === "1") {
		logger.log({
			message: `App started in api only mode.`,
			type: "app.start.api-mode"
		});
		return;
	}

	container.getAll<IExecutor>(IocKey.Executors).forEach((listener) => {
		listener.start();
		listener.startRetryManager();
	});
	container.getAll<IStandaloneApps>(IocKey.StandAloneApps).forEach((app) => {
		app.start();
	});

	logger.log({
		message: `App started in full mode.`,
		type: "app.start.full-mode"
	});

	process.on("SIGINT", process.exit).on("SIGTERM", process.exit);
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error(err);
	process.exit(0);
});
