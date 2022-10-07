import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IExecutor } from "./Interfaces/IExecutor";
import { ILogger } from "./Interfaces/ILogger";

async function main() {
	const container = await initializeContainer();
	const logger = container.get<ILogger>(IocKey.Logger);

	container.getAll<IExecutor>(IocKey.Executors).forEach((listener) => {
		listener.start();
		listener.startRetryManager();
	});

	logger.log({
		message: `Consumers started in full mode.`,
		type: "consumers.start"
	});

	process.on("SIGINT", process.exit).on("SIGTERM", process.exit);
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error(err);
	process.exit(0);
});
