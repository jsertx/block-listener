/* eslint-disable no-console */
import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IExecutor } from "./Interfaces/IExecutor";

async function main(useCaseName: string, amount: number) {
	const container = await initializeContainer();

	container.getAll<IExecutor>(IocKey.Executors).forEach((listener) => {
		if (listener.constructor.name === useCaseName) {
			console.log(
				`Recovering ${amount || "all"} messages from ${useCaseName}`
			);
			listener.startDeadRecovery({ amount });
		}
	});
}

// eslint-disable-next-line no-console
const [_bin, _file, useCaseName, amount] = process.argv;
main(useCaseName, Number(amount)).catch(console.error);
