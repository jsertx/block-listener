import { Executor } from "../../../../../src/Infrastructure/Broker/Executor";
import { IBroker } from "../../../../../src/Interfaces/IBroker";
import { ILogger } from "../../../../../src/Interfaces/ILogger";

export class TestingExecutor extends Executor<any> {
	constructor(
		private executeMock: jest.Mock,
		logger: ILogger,
		broker: IBroker,
		channel: string
	) {
		super(logger, broker, channel);
	}
	async execute(payload: any): Promise<void> {
		await this.executeMock(payload);
	}

	getMessageContextTrace(payload: any) {
		return payload;
	}
}
