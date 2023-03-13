import { BlockchainId } from "../../Values/Blockchain";

import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";
import { Publication } from "../../../Infrastructure/Broker/Rabbitmq/Enums";
import { TxProps } from "../../Entities/Tx";

export interface TxProcessedPayload {
	blockchain: BlockchainId;
	tx: TxProps;
}
/**
 * MaxRetries should be a consumer executor as the message does not
 * need to know needs of the consumer
 */
export class TxProcessed extends ExecutorMessage<TxProcessedPayload> {
	constructor(payload: TxProcessedPayload) {
		super(Publication.TxProcessed, payload, {
			maxRetries: 30
		});
	}
}
