import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";

export interface WhaleDiscoveredPayload {
	blockchain: BlockchainId;
	address: string;
}

export class WhaleDiscovered extends ExecutorMessage<WhaleDiscoveredPayload> {
	constructor(blockchain: BlockchainId, payload: WhaleDiscoveredPayload) {
		super(Publication.WhaleDiscovered(blockchain), payload);
	}
}
