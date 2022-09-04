import { inject, injectable } from "inversify";
import { IocKey } from "../../Ioc/IocKey";
import { BrokerAsPromised } from "rascal";
import {
	BaseMessage,
	IBroker,
	IBrokerPublicationReceipt,
	IBrokerSubscription
} from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";
import { Axios } from "axios";
import { IConfig } from "../../Interfaces/IConfig";

interface IQueueInfo {
	backing_queue_status: {
		len: number;
	};
}
@injectable()
export class RabbitMQ implements IBroker<any, any> {
	private apiClient: Axios;
	constructor(
		@inject(IocKey.RabbitMQClient) private client: BrokerAsPromised,
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.Config) private config: IConfig
	) {
		this.apiClient = new Axios({
			baseURL: this.config.broker.config.apiUrl
		});
	}

	async getPendingMessages(channel: any): Promise<number> {
		const config = this.client.config.vhosts?.["/"];
		if (!config) {
			throw new Error("No RabbitMQ Config for the default vhost '/'");
		}
		const vHost = "%2F";
		const queue = (config.queues as any)?.[channel].name;
		if (!queue) {
			throw new Error(`No queue for subscription ${channel}`);
		}
		const res = await this.apiClient
			.get<IQueueInfo>(`/queues/${vHost}/${queue}`)
			.then((res) => res.data && JSON.parse(res.data as any));

		return res.backing_queue_status.len || 0;
	}

	async publish({
		channel,
		payload
	}: BaseMessage<any, any>): Promise<IBrokerPublicationReceipt> {
		await this.client.publish(channel, payload).catch((error) => {
			this.logger.error({
				message: "Failed message",
				type: "pubsub.publish",
				success: false,
				error,
				context: {
					channel
				}
			});
			throw error;
		});
		return { success: true };
	}
	async subscribe(
		channel: string,
		callback: (
			message: any,
			ack: () => any,
			nack: (error: Error) => any
		) => Promise<any>
	): Promise<IBrokerSubscription> {
		const subscription = await this.client.subscribe(channel);
		this.logger.log({
			message: `Subscribed to ${channel}`,
			type: "pubsub.subscribe",
			success: true,
			context: {
				channel
			}
		});
		subscription
			.on("message", (message, content, ackOrNack) => {
				const ack = () => ackOrNack();
				const nack = (...args: any[]) => ackOrNack(...args);
				callback(content, ack, nack).catch((error) => {
					this.logger.error({
						type: "pubsub.subscription.error",
						message: "Error consuming message",
						error
					});
					nack(error);
				});
			})
			.on("error", (error) => {
				this.logger.error({
					message: `Subscription error at ${channel}`,
					type: "pubsub.subscription",
					error,
					context: {
						channel
					}
				});
			});
		return {
			off: () => {
				this.logger.log({
					message: `Unsubscribed from ${channel}`,
					type: "pubsub.unsubscribe",
					success: true,
					context: {
						channel
					}
				});

				return subscription.cancel();
			}
		};
	}
}
