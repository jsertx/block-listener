export type IBrokerSubCallback<T = any> = (
	message: T,
	ack: () => any,
	nack: (error: any) => any
) => Promise<any>;

export interface IBrokerPublicationReceipt {
	success: boolean;
}

export interface IBrokerSubscription {
	off: () => Promise<void>;
}

export class BaseMessage<Publication, Payload> {
	constructor(
		public readonly channel: Publication,
		public readonly payload: Payload
	) {}
}

export interface IBroker<Publications = string, Subscriptions = string> {
	publish<T = any>(
		msg: BaseMessage<Publications, T>
	): Promise<IBrokerPublicationReceipt>;
	subscribe(
		channel: Subscriptions,
		callback: IBrokerSubCallback
	): Promise<IBrokerSubscription>;
}
