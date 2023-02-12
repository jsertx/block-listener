import { BlockWithTransactions } from "../../Types/BlockWithTransactions";
import { BlockchainId } from "../../Values/Blockchain";

import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";
import { Publication } from "../../../Infrastructure/Broker/Rabbitmq/Enums";

export interface BlockReceivedPayload {
	blockchain: BlockchainId;
	block: BlockWithTransactions;
}
export class BlockReceived extends ExecutorMessage<BlockReceivedPayload> {
	constructor(payload: BlockReceivedPayload) {
		super(Publication.BlockReceived, payload);
	}
}
