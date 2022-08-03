import { injectable, unmanaged } from "inversify";
import { IBroker } from "../../Interfaces/IBroker";
import { IExecutor } from "../../Interfaces/IExecutor";
import { ILogger } from "../../Interfaces/ILogger";
import { BaseMessage } from "./BaseMessage";

interface IExecutorMsgPayload<T> {
	retries: number;
	maxRetries: number;
	payload: T;
	processAfter: number;
	error?: Error;
}

export class ExecutorMessage<T = any> extends BaseMessage<
	IExecutorMsgPayload<T>
> {
	constructor(
		channel: string,
		payload: T,
		opts?: Partial<IExecutorMsgPayload<T>>
	) {
		super(channel, {
			retries: 0,
			maxRetries: 10,
			processAfter: Date.now(),
			...opts,
			payload
		});
	}
}

const backoffDelayStrategy = (retry: number, _error?: any) =>
	Math.floor(2 ** (1.5 * retry) * 1000);

const serializeError = (error: any) => ({
	name: error.name,
	message: error.message,
	stack: error.stack
});

const defaultOptions = {
	retriable: true,
	backoffStrategy: backoffDelayStrategy
};
export interface ExecutorOptions {
	retriable: boolean;
	backoffStrategy: (retry: number, error?: any) => number;
}

@injectable()
export abstract class Executor<PayloadType> implements IExecutor {
	private options: ExecutorOptions;
	constructor(
		@unmanaged()
		protected logger: ILogger,
		@unmanaged()
		protected broker: IBroker,
		@unmanaged()
		protected channel: string,
		@unmanaged()
		options: Partial<ExecutorOptions> = {}
	) {
		this.options = {
			...defaultOptions,
			...options
		};
	}

	get retryChannel() {
		return this.channel;
	}

	get deadChannel() {
		return this.channel;
	}

	abstract execute(
		payload: PayloadType,
		message?: IExecutorMsgPayload<PayloadType>
	): Promise<void>;

	private async executionWrapper(
		message: IExecutorMsgPayload<PayloadType>,
		ack: () => any,
		nack: (error: any, options?: any) => any
	) {
		try {
			if (message.retries < 3) {
				throw new Error("");
			}
			await this.execute(message.payload, message);
			ack();
		} catch (error) {
			this.logger.error({
				error,
				type: "executor.execution",
				message: "Executor execution failed",
				context: {
					channel: this.channel,
					executorClass: this.constructor.name,
					message
				}
			});
			await this.retryHandler(message, error).then(ack).catch(nack);
		}
	}
	private shouldWait(message: ExecutorMessage<PayloadType>) {
		return message.payload.processAfter > Date.now();
	}

	protected messageCanBeRetried(message: ExecutorMessage, _error: any) {
		return (
			this.options.retriable &&
			message.payload.retries <= message.payload.maxRetries
		);
	}

	private async retryHandler(
		message: IExecutorMsgPayload<PayloadType>,
		error: any
	) {
		const { retries } = message;

		const delay = this.options.backoffStrategy(retries, error);
		const retryMsg = new ExecutorMessage<PayloadType>(
			this.retryChannel,
			message.payload,
			{
				retries: retries + 1,
				processAfter: Date.now() + delay,
				error: serializeError(error)
			}
		);
		await this.broker.publish(retryMsg);
	}

	private async retryManager(
		message: ExecutorMessage<PayloadType>,
		ack: () => any,
		nack: (error: any, options?: any) => any
	) {
		try {
			const error = message.payload.error;
			if (!this.messageCanBeRetried(message, error)) {
				const deadMsg = new ExecutorMessage<PayloadType>(
					this.deadChannel,
					message.payload.payload
				);
				return this.broker.publish(deadMsg).then(ack).catch(nack);
			}

			if (this.shouldWait(message)) {
				return this.broker.publish(message).then(ack).catch(nack);
			}
			const processMsg = new ExecutorMessage<PayloadType>(
				this.channel,
				message.payload.payload
			);
			await this.broker.publish(processMsg).then(ack).catch(nack);
		} catch (error) {
			this.logger.error({
				error,
				type: "executor.retry-manager",
				message: "Executor retry managing failed",
				context: {
					channel: this.channel,
					message
				}
			});
			await this.retryHandler(message.payload, error)
				.then(ack)
				.catch(nack);
		}
	}

	start() {
		this.broker.subscribe(this.channel, this.executionWrapper.bind(this));
	}

	startDeadRecovery() {
		this.broker.subscribe(this.deadChannel, async (message, ack, nack) => {
			const processMsg = new ExecutorMessage<PayloadType>(
				this.channel,
				message.payload
			);
			this.broker.publish(processMsg).then(ack).catch(nack);
		});
	}

	startRetryManager() {
		this.broker.subscribe(this.retryChannel, this.retryManager.bind(this));
	}
}
