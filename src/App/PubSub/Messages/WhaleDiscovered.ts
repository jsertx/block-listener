import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";

export interface WhaleDiscoveredPayload {
	blockchain: BlockchainId;
	address: string;
}

export class WhaleDiscovered extends BaseMessage<WhaleDiscoveredPayload> {
	constructor(blockchain: BlockchainId, payload: WhaleDiscoveredPayload) {
		super(Publication.WhaleDiscovered(blockchain), payload);
	}
}
