import { BlockWithTransactions } from "../../Types/BlockWithTransactions";
import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";

export interface BlockReceivedPayload {
	blockchain: BlockchainId;
	block: BlockWithTransactions;
}
export class BlockReceived extends ExecutorMessage<BlockReceivedPayload> {
	constructor(payload: BlockReceivedPayload) {
		super(Publication.BlockReceived(payload.blockchain), payload);
	}
}
