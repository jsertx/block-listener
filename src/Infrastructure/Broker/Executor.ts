/* eslint-disable no-console */
import { injectable, unmanaged } from "inversify";
import { IBroker } from "../../Interfaces/IBroker";
import { DeadRecoveryOptions, IExecutor } from "../../Interfaces/IExecutor";
import { ILogger } from "../../Interfaces/ILogger";
import { BaseMessage } from "./BaseMessage";
import { addRetryPrefix, addDeadPrefix } from "./Rabbitmq/Utils/ConfigCreation";

interface IExecutorMsgPayload<T> {
	retries: number;
	maxRetries: number;
	payload: T;
	processAfter: number;
	error?: Error;
}

export class DirectToDead extends Error {
	constructor(message: string, public readonly retriable: boolean = true) {
		super(`[Executor] Direct to Dead. Reason: ${message}`);
	}
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

const backoffDefaultStrategy = (retry: number, _error?: any) =>
	Math.floor(2 ** (1.5 * retry) * 1000) + 5000;

const serializeError = (error: any) => ({
	name: error.name,
	message: error.message,
	stack: error.stack
});

const defaultOptions = {
	retriable: true,
	backoffStrategy: backoffDefaultStrategy
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
		return addRetryPrefix(this.channel);
	}

	get deadChannel() {
		return addDeadPrefix(this.channel);
	}

	protected abstract execute(
		payload: PayloadType,
		message?: IExecutorMsgPayload<PayloadType>
	): Promise<void>;

	private async executionWrapper(
		message: IExecutorMsgPayload<PayloadType>,
		ack: () => any,
		nack: (error: any, options?: any) => any
	) {
		try {
			await this.execute(message.payload, message);
			ack();
		} catch (error) {
			await this.retryHandler(message, error).then(ack).catch(nack);
		}
	}
	private shouldWait(message: IExecutorMsgPayload<PayloadType>) {
		return message.processAfter > Date.now();
	}

	protected messageCanBeRetried(
		message: IExecutorMsgPayload<any>,
		_error: any
	) {
		return this.options.retriable && message.retries <= message.maxRetries;
	}

	private async retryHandler(
		message: IExecutorMsgPayload<PayloadType>,
		error: any
	) {
		const { retries } = message;
		if (error instanceof DirectToDead) {
			const deadMsg = new ExecutorMessage<PayloadType>(this.deadChannel, {
				...message.payload,
				error
			});
			return this.broker.publish(deadMsg);
		}
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
		message: IExecutorMsgPayload<PayloadType>,
		ack: () => any,
		nack: (error: any, options?: any) => any
	) {
		try {
			const error = message.error;
			if (!this.messageCanBeRetried(message, error)) {
				const deadMsg = new ExecutorMessage<PayloadType>(
					this.deadChannel,
					message.payload
				);
				return this.broker.publish(deadMsg).then(ack).catch(nack);
			}

			if (this.shouldWait(message)) {
				const waitMsg = new ExecutorMessage<PayloadType>(
					this.retryChannel,
					message.payload,
					message
				);
				return this.broker.publish(waitMsg).then(ack).catch(nack);
			}
			const processMsg = new ExecutorMessage<PayloadType>(
				this.channel,
				message.payload,
				message
			);
			await this.broker.publish(processMsg).then(ack).catch(nack);
		} catch (error) {
			this.logger.error({
				error,
				type: "executor.retry-manager",
				message: "Executor retry managing failed",
				context: {
					channel: this.channel,
					message: this.getMessageContextTrace(message.payload)
				}
			});
			await this.retryHandler(message, error).then(ack).catch(nack);
		}
	}
	abstract getMessageContextTrace(payload: PayloadType): any;
	async start() {
		this.logger.log({
			type: `executor.start`,
			message: `Subscribed to ${this.channel}`,
			context: {
				channel: this.channel,
				executorClass: this.constructor.name
			}
		});
		await this.broker.subscribe(
			this.channel,
			this.executionWrapper.bind(this)
		);
	}

	async startDeadRecovery({ amount }: DeadRecoveryOptions) {
		let msgCount = 0;
		await this.broker.subscribe(
			this.deadChannel,
			async (message, ack, nack) => {
				const processMsg = new ExecutorMessage<PayloadType>(
					this.channel,
					message.payload
				);
				await this.broker.publish(processMsg).then(ack).catch(nack);
				msgCount++;

				if (amount && msgCount === amount) {
					console.log(`${msgCount}/${amount}`);
					return process.exit(0);
				}
				if (msgCount % 5 === 0) {
					console.log(`${msgCount}/${amount}`);
				}
			}
		);
	}

	async startRetryManager() {
		await this.broker.subscribe(
			this.retryChannel,
			this.retryManager.bind(this)
		);
	}
}
