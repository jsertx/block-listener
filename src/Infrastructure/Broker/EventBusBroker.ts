import { inject, injectable } from "inversify";
import { IocKey } from "../../Ioc/IocKey";

import {
	BaseMessage,
	IBroker,
	IBrokerPublicationReceipt,
	IBrokerSubscription
} from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";
import EventEmitter from "eventemitter3";
import { PublicationTypes } from "./Publication";
import { Subscription } from "./Subscription";

function resolvePublicationToQueue(publication: string): string | undefined {
	const auto = Object.values(Subscription).find((v) => v === publication);
	if (auto) {
		return auto;
	}
	if (publication.includes(PublicationTypes.BlockReceived)) {
		return Subscription.FindDirectTx;
	}
	if (publication.includes(PublicationTypes.WalletDiscovered)) {
		return Subscription.SaveWallet;
	}
	if (publication.includes(PublicationTypes.TokenDiscovered)) {
		return Subscription.SaveToken;
	}
	if (publication.includes(PublicationTypes.TxDiscovered)) {
		return Subscription.SaveTx;
	}
	if (publication.includes(PublicationTypes.WalletUpdated)) {
		return undefined;
	}
	if (publication.includes(PublicationTypes.WalletSaved)) {
		return undefined;
	}
	if (publication.includes("retry")) {
		return publication;
	}
	if (publication.includes("dead")) {
		return publication;
	}
	throw new Error("Unknown publication:" + publication);
}

@injectable()
export class EventBusBroker implements IBroker<any, any> {
	private bus = new EventEmitter();
	constructor(@inject(IocKey.Logger) private logger: ILogger) {}

	async getPendingMessages(_channel: any): Promise<number> {
		return 0;
	}

	async publish({
		channel,
		payload
	}: BaseMessage<any, any>): Promise<IBrokerPublicationReceipt> {
		try {
			const queue = resolvePublicationToQueue(channel);
			if (queue) {
				this.bus.emit(queue, payload);
			}
		} catch (error) {
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
		}
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
		this.logger.log({
			message: `Subscribed to ${channel}`,
			type: "pubsub.subscribe",
			success: true,
			context: {
				channel
			}
		});
		try {
			this.bus.on(channel, (content) => {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				const ack = () => {};
				const nack = (..._args: any[]) => {
					this.bus.emit(channel, content);
				};
				callback(content, ack, nack).catch((error) => {
					this.logger.error({
						type: "pubsub.subscription.error",
						message: "Error consuming message",
						error
					});
					nack(error);
				});
			});
		} catch (error) {
			this.logger.error({
				message: `Subscription error at ${channel}`,
				type: "pubsub.subscription",
				error,
				context: {
					channel
				}
			});
		}
		return {
			off: async () => {
				this.logger.log({
					message: `Unsubscribed from ${channel}`,
					type: "pubsub.unsubscribe",
					success: true,
					context: {
						channel
					}
				});

				this.bus.off(channel, callback);
			}
		};
	}
}
