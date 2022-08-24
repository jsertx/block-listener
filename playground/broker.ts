import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "../src/Ioc/container";

import { IocKey } from "../src/Ioc/IocKey";

import { BaseMessage, IBroker } from "../src/Interfaces/IBroker";
import { Publication } from "../src/Infrastructure/Broker/Publication";
import { BlockchainId } from "../src/App/Values/Blockchain";

(async () => {
	const container = await initializeContainer();
	const broker = await container.get<IBroker>(IocKey.Broker);

	for (let i = 0; i < 3; i++) {
		await broker
			.publish(
				new BaseMessage<any, any>(
					Publication.BlockReceived(BlockchainId.Ethereum),
					{ a: 1 }
				)
			)
			.then(() => console.log(`published ${i}`));
	}
})();
