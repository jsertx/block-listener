import { IBrokerSubCallback } from "../../Interfaces/IBroker";

type Action = (message: any) => Promise<any>;

export const createSubHandler =
	(action: Action): IBrokerSubCallback =>
	async (message: any, ack: () => any, nack: (error: any) => any) => {
		try {
			await action(message);
			ack();
		} catch (error) {
			nack(error);
		}
	};
