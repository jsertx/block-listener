import { BlockWithTransactions } from "../../Types/BlockWithTransactions";
import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";

export interface BlockReceivedPayload {
	blockchain: BlockchainId;
	block: BlockWithTransactions;
}
export class BlockReceived extends BaseMessage<BlockReceivedPayload> {
	constructor(blockchain: BlockchainId, payload: BlockReceivedPayload) {
		super(Publication.BlockReceived(blockchain), payload);
	}
}
