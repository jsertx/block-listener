import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";
import { Publication } from "../../../Infrastructure/Broker/Rabbitmq/Enums";
import { TxProps } from "../../Entities/Tx";

export type TxSavedPayload = TxProps<any>;
/**
 * MaxRetries should be a consumer executor as the message does not
 * need to know needs of the consumer
 */
export class TxSaved extends ExecutorMessage<TxSavedPayload> {
	constructor(payload: TxSavedPayload) {
		super(Publication.TxSaved, payload, {
			maxRetries: 30
		});
	}
}
